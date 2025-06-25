import path from 'node:path'

import { workdir } from '@afilmory/builder/path.js'
import type sharp from 'sharp'

import { HEIC_FORMATS } from '../constants/index.js'
import { extractExifData } from '../image/exif.js'
import { calculateHistogramAndAnalyzeTone } from '../image/histogram.js'
import {
  generateThumbnailAndBlurhash,
  thumbnailExists,
} from '../image/thumbnail.js'
import type {
  PhotoManifestItem,
  PickedExif,
  ToneAnalysis,
} from '../types/photo.js'
import { getGlobalLoggers } from './logger-adapter.js'
import type { PhotoProcessorOptions } from './processor.js'

export interface ThumbnailResult {
  thumbnailUrl: string
  thumbnailBuffer: Buffer
  blurhash: string
}

export interface CacheableData {
  thumbnail?: ThumbnailResult
  exif?: PickedExif
  toneAnalysis?: ToneAnalysis
}

/**
 * 处理缩略图和 blurhash
 * 优先复用现有数据，如果不存在或需要强制更新则重新生成
 */
export async function processThumbnailAndBlurhash(
  imageBuffer: Buffer,
  photoId: string,
  width: number,
  height: number,
  existingItem: PhotoManifestItem | undefined,
  options: PhotoProcessorOptions,
): Promise<ThumbnailResult> {
  const loggers = getGlobalLoggers()

  // 检查是否可以复用现有数据
  if (
    !options.isForceMode &&
    !options.isForceThumbnails &&
    existingItem?.blurhash &&
    (await thumbnailExists(photoId))
  ) {
    try {
      const fs = await import('node:fs/promises')
      const thumbnailPath = path.join(
        workdir,
        'public/thumbnails',
        `${photoId}.webp`,
      )
      const thumbnailBuffer = await fs.readFile(thumbnailPath)
      const thumbnailUrl = `/thumbnails/${photoId}.webp`

      loggers.blurhash.info(`复用现有 blurhash: ${photoId}`)
      loggers.thumbnail.info(`复用现有缩略图：${photoId}`)

      return {
        thumbnailUrl,
        thumbnailBuffer,
        blurhash: existingItem.blurhash,
      }
    } catch (error) {
      loggers.thumbnail.warn(`读取现有缩略图失败，重新生成：${photoId}`, error)
      // 继续执行生成逻辑
    }
  }

  // 生成新的缩略图和 blurhash
  const result = await generateThumbnailAndBlurhash(
    imageBuffer,
    photoId,
    width,
    height,
    options.isForceMode || options.isForceThumbnails,
    {
      thumbnail: loggers.thumbnail.originalLogger,
      blurhash: loggers.blurhash.originalLogger,
    },
  )

  return {
    thumbnailUrl: result.thumbnailUrl!,
    thumbnailBuffer: result.thumbnailBuffer!,
    blurhash: result.blurhash!,
  }
}

/**
 * 处理 EXIF 数据
 * 优先复用现有数据，如果不存在或需要强制更新则重新提取
 */
export async function processExifData(
  imageBuffer: Buffer,
  rawImageBuffer: Buffer | undefined,
  photoKey: string,
  existingItem: PhotoManifestItem | undefined,
  options: PhotoProcessorOptions,
): Promise<PickedExif | null> {
  const loggers = getGlobalLoggers()

  // 检查是否可以复用现有数据
  if (!options.isForceMode && !options.isForceManifest && existingItem?.exif) {
    const photoId = path.basename(photoKey, path.extname(photoKey))
    loggers.exif.info(`复用现有 EXIF 数据：${photoId}`)
    return existingItem.exif
  }

  // 提取新的 EXIF 数据
  const ext = path.extname(photoKey).toLowerCase()
  const originalBuffer = HEIC_FORMATS.has(ext) ? rawImageBuffer : undefined

  return await extractExifData(imageBuffer, originalBuffer)
}

/**
 * 处理影调分析
 * 优先复用现有数据，如果不存在或需要强制更新则重新计算
 */
export async function processToneAnalysis(
  sharpInstance: sharp.Sharp,
  photoKey: string,
  existingItem: PhotoManifestItem | undefined,
  options: PhotoProcessorOptions,
): Promise<ToneAnalysis | null> {
  const loggers = getGlobalLoggers()

  // 检查是否可以复用现有数据
  if (
    !options.isForceMode &&
    !options.isForceManifest &&
    existingItem?.toneAnalysis
  ) {
    const photoId = path.basename(photoKey, path.extname(photoKey))
    loggers.tone.info(`复用现有影调分析：${photoId}`)
    return existingItem.toneAnalysis
  }

  // 计算新的影调分析
  return await calculateHistogramAndAnalyzeTone(
    sharpInstance,
    loggers.tone.originalLogger,
  )
}

/**
 * 检查是否需要处理照片
 * 考虑文件更新状态和缓存存在性
 */
export async function shouldProcessPhoto(
  photoKey: string,
  existingItem: PhotoManifestItem | undefined,
  obj: { LastModified?: Date; ETag?: string },
  options: PhotoProcessorOptions,
): Promise<{ shouldProcess: boolean; reason: string }> {
  const photoId = path.basename(photoKey, path.extname(photoKey))

  // 强制模式下总是处理
  if (options.isForceMode) {
    return { shouldProcess: true, reason: '强制模式' }
  }

  // 新照片总是需要处理
  if (!existingItem) {
    return { shouldProcess: true, reason: '新照片' }
  }

  // 检查文件是否更新
  const fileNeedsUpdate =
    existingItem.lastModified !== obj.LastModified?.toISOString()

  if (fileNeedsUpdate || options.isForceManifest) {
    return {
      shouldProcess: true,
      reason: fileNeedsUpdate ? '文件已更新' : '强制更新清单',
    }
  }

  // 检查缩略图是否存在
  const hasThumbnail = await thumbnailExists(photoId)
  if (!hasThumbnail || options.isForceThumbnails) {
    return {
      shouldProcess: true,
      reason: options.isForceThumbnails ? '强制重新生成缩略图' : '缩略图缺失',
    }
  }

  return { shouldProcess: false, reason: '无需处理' }
}
