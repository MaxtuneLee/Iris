import path from 'node:path'

import type { _Object } from '@aws-sdk/client-s3'
import { workdir } from '@photo-gallery/builder/path.js'
import type { Exif } from 'exif-reader'
import sharp from 'sharp'

import { HEIC_FORMATS } from '../constants/index.js'
import { extractExifData } from '../image/exif.js'
import {
  convertBmpToJpegSharpInstance,
  getImageMetadataWithSharp,
  isBitmap,
  preprocessImageBuffer,
} from '../image/processor.js'
import {
  generateThumbnailAndBlurhash,
  thumbnailExists,
} from '../image/thumbnail.js'
import type { Logger } from '../logger/index.js'
import { needsUpdate } from '../manifest/manager.js'
import { generateS3Url, getImageFromS3 } from '../s3/operations.js'
import type { PhotoManifestItem, ProcessPhotoResult } from '../types/photo.js'
import { extractPhotoInfo } from './info-extractor.js'

export interface PhotoProcessorOptions {
  isForceMode: boolean
  isForceManifest: boolean
  isForceThumbnails: boolean
}

export interface WorkerLoggers {
  image: Logger['image']
  s3: Logger['s3']
  thumbnail: Logger['thumbnail']
  blurhash: Logger['blurhash']
  exif: Logger['exif']
}

// 处理单张照片
export async function processPhoto(
  obj: _Object,
  index: number,
  workerId: number,
  totalImages: number,
  existingManifestMap: Map<string, PhotoManifestItem>,
  livePhotoMap: Map<string, _Object>,
  options: PhotoProcessorOptions,
  logger: Logger,
): Promise<ProcessPhotoResult> {
  const key = obj.Key
  if (!key) {
    logger.image.warn(`跳过没有 Key 的对象`)
    return { item: null, type: 'failed' }
  }

  const photoId = path.basename(key, path.extname(key))
  const existingItem = existingManifestMap.get(key)

  // 创建 worker 专用的 logger
  const workerLoggers: WorkerLoggers = {
    image: logger.worker(workerId).withTag('IMAGE'),
    s3: logger.worker(workerId).withTag('S3'),
    thumbnail: logger.worker(workerId).withTag('THUMBNAIL'),
    blurhash: logger.worker(workerId).withTag('BLURHASH'),
    exif: logger.worker(workerId).withTag('EXIF'),
  }

  workerLoggers.image.info(`📸 [${index + 1}/${totalImages}] ${key}`)

  // 检查是否需要更新
  if (
    !options.isForceMode &&
    !options.isForceManifest &&
    existingItem &&
    !needsUpdate(existingItem, obj)
  ) {
    // 检查缩略图是否存在，如果不存在或强制刷新缩略图则需要重新处理
    const hasThumbnail = await thumbnailExists(photoId)
    if (hasThumbnail && !options.isForceThumbnails) {
      workerLoggers.image.info(`⏭️ 跳过处理 (未更新且缩略图存在): ${key}`)
      return { item: existingItem, type: 'skipped' }
    } else {
      if (options.isForceThumbnails) {
        workerLoggers.image.info(`🔄 强制重新生成缩略图：${key}`)
      } else {
        workerLoggers.image.info(
          `🔄 重新生成缩略图 (文件未更新但缩略图缺失): ${key}`,
        )
      }
    }
  }

  // 需要处理的照片（新照片、更新的照片或缺失缩略图的照片）
  const isNewPhoto = !existingItem
  if (isNewPhoto) {
    workerLoggers.image.info(`🆕 新照片：${key}`)
  } else {
    workerLoggers.image.info(`🔄 更新照片：${key}`)
  }

  try {
    // 获取图片数据
    const rawImageBuffer = await getImageFromS3(key, workerLoggers.s3)
    if (!rawImageBuffer) return { item: null, type: 'failed' }

    // 预处理图片（处理 HEIC/HEIF 格式）
    let imageBuffer: Buffer
    try {
      imageBuffer = await preprocessImageBuffer(
        rawImageBuffer,
        key,
        workerLoggers.image,
      )
    } catch (error) {
      workerLoggers.image.error(`预处理图片失败：${key}`, error)
      return { item: null, type: 'failed' }
    }

    // 创建 Sharp 实例，复用于多个操作
    let sharpInstance = sharp(imageBuffer)

    // 处理 BMP
    if (isBitmap(imageBuffer)) {
      try {
        // Convert the BMP image to JPEG format and create a new Sharp instance for the converted image.
        sharpInstance = await convertBmpToJpegSharpInstance(
          imageBuffer,
          workerLoggers.image,
        )
        // Update the image buffer to reflect the new JPEG data from the Sharp instance.
        imageBuffer = await sharpInstance.toBuffer()
      } catch (error) {
        workerLoggers.image.error(`转换 BMP 失败：${key}`, error)
        return { item: null, type: 'failed' }
      }
    }

    // 获取图片元数据（复用 Sharp 实例）
    const metadata = await getImageMetadataWithSharp(
      sharpInstance,
      workerLoggers.image,
    )
    if (!metadata) return { item: null, type: 'failed' }

    // 如果是增量更新且已有 blurhash，可以复用
    let thumbnailUrl: string | null = null
    let thumbnailBuffer: Buffer | null = null
    let blurhash: string | null = null

    if (
      !options.isForceMode &&
      !options.isForceThumbnails &&
      existingItem?.blurhash &&
      (await thumbnailExists(photoId))
    ) {
      // 复用现有的缩略图和 blurhash
      blurhash = existingItem.blurhash
      workerLoggers.blurhash.info(`复用现有 blurhash: ${photoId}`)

      try {
        const fs = await import('node:fs/promises')
        const thumbnailPath = path.join(
          workdir,
          'public/thumbnails',
          `${photoId}.webp`,
        )
        thumbnailBuffer = await fs.readFile(thumbnailPath)
        thumbnailUrl = `/thumbnails/${photoId}.webp`
        workerLoggers.thumbnail.info(`复用现有缩略图：${photoId}`)
      } catch (error) {
        workerLoggers.thumbnail.warn(
          `读取现有缩略图失败，重新生成：${photoId}`,
          error,
        )
        // 继续执行生成逻辑
      }
    }

    // 如果没有复用成功，则生成缩略图和 blurhash
    if (!thumbnailUrl || !thumbnailBuffer || !blurhash) {
      const result = await generateThumbnailAndBlurhash(
        imageBuffer,
        photoId,
        metadata.width,
        metadata.height,
        options.isForceMode || options.isForceThumbnails,
        {
          thumbnail: workerLoggers.thumbnail,
          blurhash: workerLoggers.blurhash,
        },
      )

      thumbnailUrl = result.thumbnailUrl
      thumbnailBuffer = result.thumbnailBuffer
      blurhash = result.blurhash
    }

    // 如果是增量更新且已有 EXIF 数据，可以复用
    let exifData: Exif | null = null
    if (
      !options.isForceMode &&
      !options.isForceManifest &&
      existingItem?.exif
    ) {
      exifData = existingItem.exif
      workerLoggers.exif.info(`复用现有 EXIF 数据：${photoId}`)
    } else {
      // 传入原始 buffer 以便在转换后的图片缺少 EXIF 时回退
      const ext = path.extname(key).toLowerCase()
      const originalBuffer = HEIC_FORMATS.has(ext) ? rawImageBuffer : undefined
      exifData = await extractExifData(
        imageBuffer,
        originalBuffer,
        workerLoggers.exif,
      )
    }

    // 提取照片信息（在获取 EXIF 数据之后，以便使用 DateTimeOriginal）
    const photoInfo = extractPhotoInfo(key, exifData, workerLoggers.image)

    const aspectRatio = metadata.width / metadata.height

    // 检查是否为 live photo
    const livePhotoVideo = livePhotoMap.get(key)
    const isLivePhoto = !!livePhotoVideo
    let livePhotoVideoUrl: string | undefined
    let livePhotoVideoS3Key: string | undefined

    if (isLivePhoto && livePhotoVideo?.Key) {
      livePhotoVideoS3Key = livePhotoVideo.Key
      livePhotoVideoUrl = generateS3Url(livePhotoVideo.Key)
      workerLoggers.image.info(
        `📱 检测到 Live Photo：${key} -> ${livePhotoVideo.Key}`,
      )
    }

    const photoItem: PhotoManifestItem = {
      id: photoId,
      title: photoInfo.title,
      description: photoInfo.description,
      dateTaken: photoInfo.dateTaken,
      views: photoInfo.views,
      tags: photoInfo.tags,
      originalUrl: generateS3Url(key),
      thumbnailUrl,
      blurhash,
      width: metadata.width,
      height: metadata.height,
      aspectRatio,
      s3Key: key,
      lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
      size: obj.Size || 0,
      exif: exifData,
      // Live Photo 相关字段
      isLivePhoto,
      livePhotoVideoUrl,
      livePhotoVideoS3Key,
    }

    workerLoggers.image.success(`✅ 处理完成：${key}`)
    return { item: photoItem, type: isNewPhoto ? 'new' : 'processed' }
  } catch (error) {
    workerLoggers.image.error(`❌ 处理失败：${key}`, error)
    return { item: null, type: 'failed' }
  }
}
