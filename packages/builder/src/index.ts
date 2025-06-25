// 主要构建器
export { type BuilderOptions, defaultBuilder } from './builder/index.js'
export type { StorageConfig } from './storage/interfaces.js'
// 日志系统
export { type Logger, logger, type WorkerLogger } from './logger/index.js'

// 类型定义
export type {
  CompressedHistogramData,
  HistogramData,
  ImageMetadata,
  PhotoInfo,
  PhotoManifestItem,
  ProcessPhotoResult,
  ThumbnailResult,
  ToneAnalysis,
  ToneType,
} from './types/photo.js'

// S3 操作
export { generateBlurhash } from './image/blurhash.js'
export {
  getImageMetadataWithSharp,
  preprocessImageBuffer,
} from './image/processor.js'
export {
  generateThumbnailAndBlurhash,
  thumbnailExists,
} from './image/thumbnail.js'
export { s3Client } from './s3/client.js'

// 照片处理
export { extractPhotoInfo } from './photo/info-extractor.js'
export { type PhotoProcessorOptions, processPhoto } from './photo/processor.js'

// Manifest 管理
export {
  handleDeletedPhotos,
  loadExistingManifest,
  needsUpdate,
  saveManifest,
} from './manifest/manager.js'
export type { FujiRecipe, PickedExif } from './types/photo.js'
// Worker 池
export {
  type TaskFunction,
  WorkerPool,
  type WorkerPoolOptions,
} from './worker/pool.js'
