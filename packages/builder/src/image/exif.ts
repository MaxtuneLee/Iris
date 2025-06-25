import { writeFileSync } from 'node:fs'
import { mkdir, unlink } from 'node:fs/promises'
import path from 'node:path'

import { isNil, noop } from 'es-toolkit'
import type { ExifDateTime, Tags } from 'exiftool-vendored'
import { exiftool } from 'exiftool-vendored'
import type { Metadata } from 'sharp'
import sharp from 'sharp'

import { getGlobalLoggers } from '../photo/logger-adapter.js'
import type { PickedExif } from '../types/photo.js'

const baseImageBuffer = sharp({
  create: {
    width: 1,
    height: 1,
    channels: 3,
    background: { r: 255, g: 255, b: 255 },
  },
})
  .jpeg()
  .toBuffer()

// 提取 EXIF 数据
export async function extractExifData(
  imageBuffer: Buffer,
  originalBuffer?: Buffer,
): Promise<PickedExif | null> {
  const log = getGlobalLoggers().exif

  try {
    log.info('开始提取 EXIF 数据')

    // 首先尝试从处理后的图片中提取 EXIF
    let metadata = await sharp(imageBuffer).metadata()

    // 如果处理后的图片没有 EXIF 数据，且提供了原始 buffer，尝试从原始图片提取
    if (!metadata.exif && originalBuffer) {
      log.info('处理后的图片缺少 EXIF 数据，尝试从原始图片提取')
      try {
        metadata = await sharp(originalBuffer).metadata()
      } catch (error) {
        log.warn('从原始图片提取 EXIF 失败，可能是不支持的格式：', error)
      }
    }

    if (!metadata.exif) {
      log.warn('未找到 EXIF 数据')
      return null
    }

    let startIndex = 0
    for (let i = 0; i < metadata.exif.length; i++) {
      if (
        metadata.exif.toString('ascii', i, i + 2) === 'II' ||
        metadata.exif.toString('ascii', i, i + 2) === 'MM'
      ) {
        startIndex = i
        break
      }
      if (metadata.exif.toString('ascii', i, i + 4) === 'Exif') {
        startIndex = i
        break
      }
    }
    const exifBuffer = metadata.exif.subarray(startIndex)

    const soi = Buffer.from([0xff, 0xd8])
    const app1Marker = Buffer.from([0xff, 0xe1])
    const exifLength = Buffer.alloc(2)
    exifLength.writeUInt16BE(exifBuffer.length + 2, 0)

    const finalBuffer = Buffer.concat([
      soi,
      app1Marker,
      exifLength,
      exifBuffer as any,
      (await baseImageBuffer).subarray(2),
    ])
    await mkdir('/tmp/image_process', { recursive: true })
    const tempImagePath = path.resolve(
      '/tmp/image_process',
      `${crypto.randomUUID()}.jpg`,
    )

    writeFileSync(tempImagePath, finalBuffer)

    const exifData = await exiftool.read(tempImagePath)
    const result = handleExifData(exifData, metadata)

    await unlink(tempImagePath).catch(noop)

    if (!exifData) {
      log.warn('EXIF 数据解析失败')
      return null
    }

    // 清理 EXIF 数据中的空字符和无用数据

    delete exifData.warnings
    delete exifData.errors

    log.success('EXIF 数据提取完成')
    return result
  } catch (error) {
    log.error('提取 EXIF 数据失败:', error)
    return null
  }
}

const pickKeys: Array<keyof Tags | (string & {})> = [
  'tz',
  'tzSource',
  'Orientation',
  'Make',
  'Model',
  'Software',
  'Artist',
  'Copyright',
  'ExposureTime',

  'FNumber',
  'ExposureProgram',
  'ISO',
  'OffsetTime',
  'OffsetTimeOriginal',
  'OffsetTimeDigitized',
  'ShutterSpeedValue',
  'ApertureValue',
  'BrightnessValue',
  'ExposureCompensationSet',
  'ExposureCompensationMode',
  'ExposureCompensationSetting',

  'ExposureCompensation',
  'MaxApertureValue',
  'LightSource',
  'Flash',
  'FocalLength',

  'ColorSpace',
  'ExposureMode',
  'FocalLengthIn35mmFormat',
  'SceneCaptureType',
  'LensMake',
  'LensModel',
  'MeteringMode',
  'WhiteBalance',
  'WBShiftAB',
  'WBShiftGM',
  'WhiteBalanceBias',
  'WhiteBalanceFineTune',
  'FlashMeteringMode',
  'SensingMethod',
  'FocalPlaneXResolution',
  'FocalPlaneYResolution',

  'Aperture',
  'ScaleFactor35efl',
  'ShutterSpeed',
  'LightValue',
  // GPS
  'GPSAltitude',
  'GPSCoordinates',
  'GPSAltitudeRef',
  'GPSLatitude',
  'GPSLatitudeRef',
  'GPSLongitude',
  'GPSLongitudeRef',
]
function handleExifData(exifData: Tags, metadata: Metadata): PickedExif {
  const date = {
    DateTimeOriginal: formatExifDate(exifData.DateTimeOriginal),
    DateTimeDigitized: formatExifDate(exifData.DateTimeDigitized),
    OffsetTime: exifData.OffsetTime,
    OffsetTimeOriginal: exifData.OffsetTimeOriginal,
    OffsetTimeDigitized: exifData.OffsetTimeDigitized,
  }

  let FujiRecipe: any = null
  if (exifData.FilmMode) {
    FujiRecipe = {
      FilmMode: exifData.FilmMode,
      GrainEffectRoughness: exifData.GrainEffectRoughness,
      GrainEffectSize: exifData.GrainEffectSize,
      ColorChromeEffect: exifData.ColorChromeEffect,
      ColorChromeFxBlue: exifData.ColorChromeFXBlue,
      WhiteBalance: exifData.WhiteBalance,
      WhiteBalanceFineTune: exifData.WhiteBalanceFineTune,
      DynamicRange: exifData.DynamicRange,
      HighlightTone: exifData.HighlightTone,
      ShadowTone: exifData.ShadowTone,
      Saturation: exifData.Saturation,
      Sharpness: exifData.Sharpness,
      NoiseReduction: exifData.NoiseReduction,
      Clarity: exifData.Clarity,
      ColorTemperature: exifData.ColorTemperature,
      DevelopmentDynamicRange: (exifData as any).DevelopmentDynamicRange,
      DynamicRangeSetting: exifData.DynamicRangeSetting,
    }
  }

  let SonyRecipe: any = null
  if (!isNil(exifData.CreativeStyle)) {
    SonyRecipe = {
      CreativeStyle: exifData.CreativeStyle,
      PictureEffect: exifData.PictureEffect,
      Hdr: exifData.Hdr,
      SoftSkinEffect: exifData.SoftSkinEffect,
    }
  }
  const size = {
    ImageWidth: exifData.ExifImageWidth || metadata.width,
    ImageHeight: exifData.ExifImageHeight || metadata.height,
  }
  const result: any = structuredClone(exifData)
  for (const key in result) {
    Reflect.deleteProperty(result, key)
  }
  for (const key of pickKeys) {
    result[key] = exifData[key]
  }

  return {
    ...date,
    ...size,
    ...result,

    ...(FujiRecipe ? { FujiRecipe } : {}),
    ...(SonyRecipe ? { SonyRecipe } : {}),
  }
}

const formatExifDate = (date: string | ExifDateTime | undefined) => {
  if (!date) {
    return
  }

  if (typeof date === 'string') {
    return new Date(date).toISOString()
  }

  return date.toISOString()
}
