import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import sharp from 'sharp'

// 创建 SVG favicon 设计
function createFaviconSVG(size: number) {
  const iconSize = size * 0.8 // 图标占 80% 的空间
  const padding = (size - iconSize) / 2

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="frame1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="frame2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8f8f8;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e8e8e8;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      
      <!-- 背景 -->
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
      
      <!-- 主照片框 -->
      <rect x="${padding + iconSize * 0.1}" y="${padding + iconSize * 0.15}" 
            width="${iconSize * 0.5}" height="${iconSize * 0.4}" 
            rx="${iconSize * 0.02}" fill="url(#frame1)" filter="url(#shadow)"
            transform="rotate(-8 ${size / 2} ${size / 2})"/>
      
      <!-- 照片内容 -->
      <rect x="${padding + iconSize * 0.12}" y="${padding + iconSize * 0.17}" 
            width="${iconSize * 0.46}" height="${iconSize * 0.36}" 
            rx="${iconSize * 0.01}" fill="#4a90e2"
            transform="rotate(-8 ${size / 2} ${size / 2})"/>
      
      <!-- 第二张照片框 -->
      <rect x="${padding + iconSize * 0.35}" y="${padding + iconSize * 0.25}" 
            width="${iconSize * 0.5}" height="${iconSize * 0.4}" 
            rx="${iconSize * 0.02}" fill="url(#frame2)" filter="url(#shadow)"
            transform="rotate(5 ${size / 2} ${size / 2})"/>
      
      <!-- 第二张照片内容 -->
      <rect x="${padding + iconSize * 0.37}" y="${padding + iconSize * 0.27}" 
            width="${iconSize * 0.46}" height="${iconSize * 0.36}" 
            rx="${iconSize * 0.01}" fill="#e74c3c"
            transform="rotate(5 ${size / 2} ${size / 2})"/>
      
      <!-- 装饰点 -->
      <circle cx="${size * 0.8}" cy="${size * 0.2}" r="${size * 0.03}" fill="rgba(255,255,255,0.3)"/>
      <circle cx="${size * 0.2}" cy="${size * 0.8}" r="${size * 0.02}" fill="rgba(255,255,255,0.2)"/>
    </svg>
  `
}

// 生成不同尺寸的 favicon
export async function generateFavicons() {
  const outputDir = join(process.cwd(), 'public')
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'android-chrome-192x192.png' },
    { size: 512, name: 'android-chrome-512x512.png' },
  ]

  try {
    // 生成 ICO 文件（包含多个尺寸）
    const icoSizes = [16, 32, 48]
    const icoBuffers: Buffer[] = []

    for (const size of icoSizes) {
      const svgContent = createFaviconSVG(size)
      const buffer = await sharp(Buffer.from(svgContent)).png().toBuffer()
      icoBuffers.push(buffer)
    }

    // 生成各种尺寸的 PNG 文件
    for (const { size, name } of sizes) {
      const svgContent = createFaviconSVG(size)
      const buffer = await sharp(Buffer.from(svgContent)).png().toBuffer()

      const outputPath = join(outputDir, name)
      writeFileSync(outputPath, buffer)
      console.info(`✅ Generated favicon: ${name} (${size}x${size})`)
    }

    // 生成主 favicon.ico（使用 32x32）
    const mainFaviconSvg = createFaviconSVG(32)
    const faviconBuffer = await sharp(Buffer.from(mainFaviconSvg))
      .png()
      .toBuffer()

    const faviconPath = join(outputDir, 'favicon.ico')
    writeFileSync(faviconPath, faviconBuffer)
    console.info(`✅ Generated main favicon: favicon.ico`)

    // 生成 site.webmanifest
    const manifest = {
      name: 'Afilmory',
      short_name: 'Afilmory',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      theme_color: '#0a0a0a',
      background_color: '#0a0a0a',
      display: 'standalone',
    }

    const manifestPath = join(outputDir, 'site.webmanifest')
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    console.info(`✅ Generated web manifest: site.webmanifest`)

    console.info(`🎨 All favicons generated successfully!`)
  } catch (error) {
    console.error('❌ Error generating favicons:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  generateFavicons().catch(console.error)
}
