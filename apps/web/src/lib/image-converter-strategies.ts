/**
 * 图像转换策略模式实现
 * 支持多种浏览器原生不支持的图片格式转换
 */

import { i18nAtom } from '~/i18n'
import { jotaiStore } from '~/lib/jotai'

import { isSafari } from './device-viewport'
import type { LoadingCallbacks} from './image-loader-manager';

// 转换结果接口
export interface ConversionResult {
  url: string
  convertedSize: number
  format: string
  originalSize: number
}

// 图像转换策略接口
export interface ImageConverterStrategy {
  /**
   * 检测是否需要转换此格式
   */
  shouldConvert: (blob: Blob) => Promise<boolean>

  /**
   * 执行转换
   */
  convert: (
    blob: Blob,
    originalUrl: string,
    callbacks?: LoadingCallbacks,
  ) => Promise<ConversionResult>

  /**
   * 策略名称，用于日志和调试
   */
  getName: () => string

  /**
   * 获取支持的格式
   */
  getSupportedFormats: () => string[]
}

// HEIC 转换策略
export class HeicConverterStrategy implements ImageConverterStrategy {
  getName(): string {
    return 'HEIC'
  }

  getSupportedFormats(): string[] {
    return ['image/heic', 'image/heif']
  }

  async shouldConvert(_blob: Blob): Promise<boolean> {
    try {
      // 动态导入 HEIC 转换模块
      const { isBrowserSupportHeic } = await import('./heic-converter')

      // 只需检查浏览器是否支持，格式检测已由 file-type 完成
      return !isBrowserSupportHeic()
    } catch (error) {
      console.error('HEIC browser support detection failed:', error)
      return false
    }
  }

  async convert(
    blob: Blob,
    originalUrl: string,
    callbacks?: LoadingCallbacks,
  ): Promise<ConversionResult> {
    const { onLoadingStateUpdate } = callbacks || {}

    try {
      // 动态导入 HEIC 转换模块
      const { convertHeicImage } = await import('./heic-converter')

      // 获取国际化文案
      const i18n = jotaiStore.get(i18nAtom)

      // 更新转换状态
      onLoadingStateUpdate?.({
        isConverting: true,
        conversionMessage: i18n.t('loading.heic.converting'),
        isHeicFormat: true,
        loadingProgress: 100,
        loadedBytes: blob.size,
        totalBytes: blob.size,
      })

      const result = await convertHeicImage(blob, originalUrl)

      return {
        url: result.url,
        convertedSize: result.convertedSize,
        format: result.format,
        originalSize: result.originalSize,
      }
    } catch (error) {
      console.error('HEIC conversion failed:', error)
      throw new Error(`HEIC conversion failed: ${error}`)
    }
  }
}

// TIFF 转换策略
export class TiffConverterStrategy implements ImageConverterStrategy {
  getName(): string {
    return 'TIFF'
  }

  getSupportedFormats(): string[] {
    return ['image/tiff', 'image/tif']
  }

  async shouldConvert(_blob: Blob): Promise<boolean> {
    return !this.isBrowserSupportTiff()
  }

  async convert(
    blob: Blob,
    originalUrl: string,
    callbacks?: LoadingCallbacks,
  ): Promise<ConversionResult> {
    const { onLoadingStateUpdate } = callbacks || {}

    try {
      // 更新转换状态
      onLoadingStateUpdate?.({
        isConverting: true,
        conversionMessage: 'Converting TIFF image...',
      })

      // 执行转换逻辑
      const result = await this.convertTiffToJpeg(blob)

      return {
        url: result.url,
        convertedSize: result.size,
        format: 'image/jpeg',
        originalSize: blob.size,
      }
    } catch (error) {
      console.error('TIFF conversion failed:', error)
      throw new Error(`TIFF conversion failed: ${error}`)
    }
  }

  // 浏览器支持检测
  private isBrowserSupportTiff(): boolean {
    // safari 支持tiff
    if (isSafari) {
      return true
    }
    return false
  }

  // 转换实现
  private async convertTiffToJpeg(
    blob: Blob,
  ): Promise<{ url: string; size: number }> {
    try {
      // 动态导入 tiff 库
      const tiff = await import('tiff')

      // 将 Blob 转换为 ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer()

      // 解码 TIFF 数据
      const ifds = tiff.decode(arrayBuffer)

      if (!ifds || ifds.length === 0) {
        throw new Error('Failed to decode TIFF image')
      }

      // 获取第一个图像帧（页面）
      const ifd = ifds[0]
      const { width, height, data, bitsPerSample } = ifd

      // 创建 Canvas 元素
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      canvas.width = width
      canvas.height = height

      // 创建 ImageData
      const imageData = ctx.createImageData(width, height)
      const pixelData = imageData.data

      // 根据位深度和通道数处理像素数据
      this.processPixelData(data, pixelData, bitsPerSample, ifd.alpha)

      // 将数据绘制到 Canvas
      ctx.putImageData(imageData, 0, 0)

      // 转换为 JPEG Blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (convertedBlob) => {
            if (convertedBlob) {
              const url = URL.createObjectURL(convertedBlob)
              resolve({ url, size: convertedBlob.size })
            } else {
              reject(new Error('Failed to convert TIFF to JPEG'))
            }
          },
          'image/jpeg',
          1,
        )
      })
    } catch (error) {
      console.error('TIFF to JPEG conversion failed:', error)
      throw error
    }
  }

  // 处理像素数据
  private processPixelData(
    sourceData: Uint8Array | Uint16Array | Float32Array | Float64Array,
    targetData: Uint8ClampedArray,
    bitsPerSample: number,
    hasAlpha = false,
  ): void {
    const channels = hasAlpha ? 4 : 3 // RGBA 或 RGB
    const pixelCount = targetData.length / 4

    for (let i = 0; i < pixelCount; i++) {
      const srcIndex = i * channels
      const dstIndex = i * 4

      switch (bitsPerSample) {
      case 8: {
        // 8位数据
        const data = sourceData as Uint8Array
        targetData[dstIndex] = data[srcIndex] || 0 // R
        targetData[dstIndex + 1] =
          channels > 1 ? data[srcIndex + 1] || 0 : data[srcIndex] || 0 // G
        targetData[dstIndex + 2] =
          channels > 2 ? data[srcIndex + 2] || 0 : data[srcIndex] || 0 // B
        targetData[dstIndex + 3] = hasAlpha ? data[srcIndex + 3] || 255 : 255 // A
      
      break;
      }
      case 16: {
        // 16位数据，需要转换为8位
        const data = sourceData as Uint16Array
        targetData[dstIndex] = Math.round((data[srcIndex] || 0) / 257) // R
        targetData[dstIndex + 1] =
          channels > 1
            ? Math.round((data[srcIndex + 1] || 0) / 257)
            : Math.round((data[srcIndex] || 0) / 257) // G
        targetData[dstIndex + 2] =
          channels > 2
            ? Math.round((data[srcIndex + 2] || 0) / 257)
            : Math.round((data[srcIndex] || 0) / 257) // B
        targetData[dstIndex + 3] = hasAlpha
          ? Math.round((data[srcIndex + 3] || 65535) / 257)
          : 255 // A
      
      break;
      }
      case 32: {
        // 32位浮点数据
        const data = sourceData as Float32Array | Float64Array
        targetData[dstIndex] = Math.round((data[srcIndex] || 0) * 255) // R
        targetData[dstIndex + 1] =
          channels > 1
            ? Math.round((data[srcIndex + 1] || 0) * 255)
            : Math.round((data[srcIndex] || 0) * 255) // G
        targetData[dstIndex + 2] =
          channels > 2
            ? Math.round((data[srcIndex + 2] || 0) * 255)
            : Math.round((data[srcIndex] || 0) * 255) // B
        targetData[dstIndex + 3] = hasAlpha
          ? Math.round((data[srcIndex + 3] || 1) * 255)
          : 255 // A
      
      break;
      }
      // No default
      }
    }
  }
}

// 图像转换策略管理器
export class ImageConverterManager {
  private strategies = new Map<string, ImageConverterStrategy>()

  constructor() {
    // 注册默认策略
    this.registerStrategy(new HeicConverterStrategy())
    this.registerStrategy(new TiffConverterStrategy())
  }

  /**
   * 注册转换策略
   */
  registerStrategy(strategy: ImageConverterStrategy): void {
    // 为每个支持的格式注册策略
    strategy.getSupportedFormats().forEach((format) => {
      this.strategies.set(format, strategy)
    })
    console.info(`Registered image converter strategy: ${strategy.getName()}`)
  }

  /**
   * 移除转换策略
   */
  removeStrategy(strategyName: string): boolean {
    let removed = false
    const strategy = Array.from(this.strategies.values()).find(
      (s) => s.getName() === strategyName,
    )

    if (strategy) {
      strategy.getSupportedFormats().forEach((format) => {
        if (this.strategies.get(format) === strategy) {
          this.strategies.delete(format)
          removed = true
        }
      })
      if (removed) {
        console.info(`Removed image converter strategy: ${strategyName}`)
      }
    }
    return removed
  }

  /**
   * 获取所有已注册的策略
   */
  getStrategies(): ImageConverterStrategy[] {
    const uniqueStrategies = new Set(this.strategies.values())
    return Array.from(uniqueStrategies)
  }

  /**
   * 使用 file-type 直接查找适合的转换策略
   */
  async findSuitableStrategy(
    blob: Blob,
  ): Promise<ImageConverterStrategy | null> {
    try {
      // 使用 file-type 检测文件格式
      const { fileTypeFromBlob } = await import('file-type')
      const fileType = await fileTypeFromBlob(blob)

      if (!fileType) {
        console.info('Could not detect file type with file-type library')
        return null
      }

      console.info(`Detected file type: ${fileType.ext} (${fileType.mime})`)

      // 直接根据 MIME 类型查找策略
      const strategy = this.strategies.get(fileType.mime)

      if (strategy) {
        // 验证策略是否确实需要转换这个文件
        const shouldConvert = await strategy.shouldConvert(blob)
        if (shouldConvert) {
          console.info(
            `Found suitable conversion strategy: ${strategy.getName()}`,
          )
          return strategy
        } else {
          console.info(
            `Strategy ${strategy.getName()} detected but conversion not needed`,
          )
          return null
        }
      }

      console.info(`No strategy found for MIME type: ${fileType.mime}`)
      return null
    } catch (error) {
      console.error('File type detection failed:', error)
      return null
    }
  }

  /**
   * 执行图像转换
   */
  async convertImage(
    blob: Blob,
    originalUrl: string,
    callbacks?: LoadingCallbacks,
  ): Promise<ConversionResult | null> {
    const strategy = await this.findSuitableStrategy(blob)

    if (!strategy) {
      console.info('No conversion strategy needed for this image')
      return null
    }

    console.info(`Converting image using ${strategy.getName()} strategy`)
    return await strategy.convert(blob, originalUrl, callbacks)
  }

  /**
   * 获取支持的格式列表
   */
  getSupportedFormats(): string[] {
    return Array.from(this.strategies.keys())
  }
}

// 导出单例实例
export const imageConverterManager = new ImageConverterManager()
