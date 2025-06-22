import type { PickedExif, ToneAnalysis } from '@afilmory/builder'

export interface PhotoManifest {
  id: string
  title: string
  description: string
  views: number
  tags: string[]
  originalUrl: string
  thumbnailUrl: string
  blurhash: string
  width: number
  height: number
  aspectRatio: number
  s3Key: string
  lastModified: string
  size: number
  exif: PickedExif
  toneAnalysis: ToneAnalysis | null // 影调分析结果
  isLivePhoto?: boolean
  livePhotoVideoUrl?: string
  livePhotoVideoS3Key?: string
}
