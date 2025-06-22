import fs from 'node:fs/promises'
import path, { basename } from 'node:path'

import { workdir } from '@afilmory/builder/path.js'
import type { _Object } from '@aws-sdk/client-s3'

import { logger } from '../logger/index.js'
import type { AfilmoryManifest } from '../types/manifest.js'
import type { PhotoManifestItem } from '../types/photo.js'

const manifestPath = path.join(workdir, 'src/data/photos-manifest.json')

export async function loadExistingManifest(): Promise<AfilmoryManifest> {
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent) as AfilmoryManifest
    if (manifest.version !== 'v2') {
      throw new Error('Invalid manifest version')
    }
    return manifest
  } catch {
    logger.fs.error(
      '🔍 未找到 manifest 文件/解析失败，创建新的 manifest 文件...',
    )
    return {
      version: 'v2',
      data: [],
    }
  }
}

// 检查照片是否需要更新（基于最后修改时间）
export function needsUpdate(
  existingItem: PhotoManifestItem | undefined,
  s3Object: _Object,
): boolean {
  if (!existingItem) return true
  if (!s3Object.LastModified) return true

  const existingModified = new Date(existingItem.lastModified)
  const s3Modified = s3Object.LastModified

  return s3Modified > existingModified
}

// 保存 manifest
export async function saveManifest(items: PhotoManifestItem[]): Promise<void> {
  // 按日期排序（最新的在前）
  const sortedManifest = [...items].sort(
    (a, b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime(),
  )

  await fs.mkdir(path.dirname(manifestPath), { recursive: true })
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        version: 'v2',
        data: sortedManifest,
      } as AfilmoryManifest,
      null,
      2,
    ),
  )

  logger.fs.info(`📁 Manifest 保存至：${manifestPath}`)
}

// 检测并处理已删除的图片
export async function handleDeletedPhotos(
  items: PhotoManifestItem[],
): Promise<number> {
  logger.main.info('🔍 检查已删除的图片...')
  if (items.length === 0) {
    // Clear all thumbnails
    await fs.rm(path.join(workdir, 'public/thumbnails'), { recursive: true })
    logger.main.info('🔍 没有图片，清空缩略图...')
    return 0
  }

  let deletedCount = 0
  const allThumbnails = await fs.readdir(
    path.join(workdir, 'public/thumbnails'),
  )

  // If thumbnails not in manifest, delete it
  const manifestKeySet = new Set(items.map((item) => item.id))

  for (const thumbnail of allThumbnails) {
    if (!manifestKeySet.has(basename(thumbnail, '.webp'))) {
      await fs.unlink(path.join(workdir, 'public/thumbnails', thumbnail))
      deletedCount++
    }
  }

  return deletedCount
}
