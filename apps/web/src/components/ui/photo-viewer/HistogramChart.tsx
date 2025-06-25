import type { ToneAnalysis } from '@afilmory/data'
import { AnimatePresence, m } from 'motion/react'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { decompressHistogram } from '~/lib/histogram'

interface HistogramChartProps {
  toneAnalysis: ToneAnalysis
  className?: string
}

interface ChannelVisibility {
  red: boolean
  green: boolean
  blue: boolean
  luminance: boolean
}

interface HoverInfo {
  x: number
  value: number
  channels: {
    red: number
    green: number
    blue: number
    luminance: number
  }
}

export const HistogramChart: FC<HistogramChartProps> = ({
  toneAnalysis,
  className = '',
}) => {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [channelVisibility, setChannelVisibility] = useState<ChannelVisibility>(
    {
      red: true,
      green: true,
      blue: true,
      luminance: true,
    },
  )
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)
  const [showStats, setShowStats] = useState(false)

  const toggleChannel = useCallback((channel: keyof ChannelVisibility) => {
    setChannelVisibility((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }))
  }, [])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const padding = 8
      const drawWidth = rect.width - padding * 2

      // 计算对应的直方图索引
      const histogramIndex = Math.floor(((x - padding) / drawWidth) * 256)

      if (histogramIndex >= 0 && histogramIndex < 256) {
        const decompressedHistogram = decompressHistogram(
          toneAnalysis.histogram,
        )
        const { red, green, blue, luminance } = decompressedHistogram

        setHoverInfo({
          x: histogramIndex,
          value: histogramIndex,
          channels: {
            red: red[histogramIndex] || 0,
            green: green[histogramIndex] || 0,
            blue: blue[histogramIndex] || 0,
            luminance: luminance[histogramIndex] || 0,
          },
        })
      }
    },
    [toneAnalysis],
  )

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 解压缩直方图数据用于渲染
    const decompressedHistogram = decompressHistogram(toneAnalysis.histogram)
    const { red, green, blue, luminance } = decompressedHistogram

    // 获取设备像素比，提高画布分辨率
    const devicePixelRatio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    // 设置画布内部分辨率
    canvas.width = rect.width * devicePixelRatio
    canvas.height = rect.height * devicePixelRatio

    // 缩放上下文以匹配设备像素比
    ctx.scale(devicePixelRatio, devicePixelRatio)

    // 设置画布样式尺寸
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // 启用抗锯齿和平滑渲染
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    const { width } = rect
    const { height } = rect
    const padding = 8

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 计算最大值用于归一化
    const maxRed = Math.max(...red)
    const maxGreen = Math.max(...green)
    const maxBlue = Math.max(...blue)
    const maxLuminance = Math.max(...luminance)
    const globalMax = Math.max(maxRed, maxGreen, maxBlue, maxLuminance)

    if (globalMax === 0) return

    const drawWidth = width - padding * 2
    const drawHeight = height - padding * 2
    const barWidth = drawWidth / 256

    // 绘制背景网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 0.5

    // 垂直网格线
    for (let i = 0; i <= 4; i++) {
      const x = padding + (i * drawWidth) / 4
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // 水平网格线
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * drawHeight) / 4
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // 绘制直方图函数
    const drawHistogram = (data: number[], color: string, alpha = 0.6) => {
      ctx.globalAlpha = alpha

      // 使用路径绘制更平滑的直方图
      ctx.beginPath()
      ctx.moveTo(padding, height - padding)

      for (const [i, datum] of data.entries()) {
        const x = padding + i * barWidth
        const barHeight = (datum / globalMax) * drawHeight
        const y = height - padding - barHeight

        ctx.lineTo(x, y)
      }

      ctx.lineTo(padding + drawWidth, height - padding)
      ctx.closePath()

      ctx.fillStyle = color
      ctx.fill()

      // 添加描边以增强视觉效果
      ctx.strokeStyle = color
      ctx.lineWidth = 0.5
      ctx.globalAlpha = alpha * 1.5
      ctx.stroke()
    }

    // 根据可见性绘制 RGB 直方图
    if (channelVisibility.red) {
      drawHistogram(red, 'rgba(255, 99, 99, 0.6)', 0.6)
    }
    if (channelVisibility.green) {
      drawHistogram(green, 'rgba(99, 255, 99, 0.6)', 0.6)
    }
    if (channelVisibility.blue) {
      drawHistogram(blue, 'rgba(99, 99, 255, 0.6)', 0.6)
    }

    // 绘制亮度直方图
    if (channelVisibility.luminance) {
      ctx.globalAlpha = 0.8

      // 使用路径绘制更平滑的亮度直方图
      ctx.beginPath()
      ctx.moveTo(padding, height - padding)

      for (const [i, element] of luminance.entries()) {
        const x = padding + i * barWidth
        const barHeight = (element / globalMax) * drawHeight
        const y = height - padding - barHeight

        ctx.lineTo(x, y)
      }

      ctx.lineTo(padding + drawWidth, height - padding)
      ctx.closePath()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fill()

      // 添加描边
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 0.5
      ctx.globalAlpha = 0.9
      ctx.stroke()
    }

    // 重置透明度
    ctx.globalAlpha = 1

    // 绘制阴影和高光区域标记
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])

    // 阴影区域 (0-85)
    const shadowEnd = padding + (85 * drawWidth) / 255
    ctx.beginPath()
    ctx.moveTo(shadowEnd, padding)
    ctx.lineTo(shadowEnd, height - padding)
    ctx.stroke()

    // 高光区域 (170-255)
    const highlightStart = padding + (170 * drawWidth) / 255
    ctx.beginPath()
    ctx.moveTo(highlightStart, padding)
    ctx.lineTo(highlightStart, height - padding)
    ctx.stroke()

    ctx.setLineDash([])

    // 绘制悬停指示线
    if (hoverInfo) {
      const barWidth = drawWidth / 256
      const hoverX = padding + hoverInfo.x * barWidth
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 1
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(hoverX, padding)
      ctx.lineTo(hoverX, height - padding)
      ctx.stroke()
    }
  }, [toneAnalysis, channelVisibility, hoverInfo])

  // 计算统计信息
  const getStatistics = () => {
    const decompressedHistogram = decompressHistogram(toneAnalysis.histogram)
    const { red, green, blue, luminance } = decompressedHistogram

    const calculateStats = (data: number[]) => {
      const total = data.reduce((sum, val) => sum + val, 0)
      if (total === 0) return { mean: 0, median: 0, mode: 0 }

      let weightedSum = 0
      let count = 0
      for (const [i, datum] of data.entries()) {
        weightedSum += i * datum
        count += datum
      }
      const mean = Math.round(weightedSum / count)

      // 找到中位数
      let cumulative = 0
      let median = 0
      for (const [i, datum] of data.entries()) {
        cumulative += datum
        if (cumulative >= count / 2) {
          median = i
          break
        }
      }

      // 找到众数
      const maxValue = Math.max(...data)
      const mode = data.indexOf(maxValue)

      return { mean, median, mode }
    }

    return {
      luminance: calculateStats(luminance),
      red: calculateStats(red),
      green: calculateStats(green),
      blue: calculateStats(blue),
    }
  }

  const stats = getStatistics()

  return (
    <div className={`relative ${className}`}>
      {/* 主画布 */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="h-[100px] w-full cursor-crosshair rounded-md bg-black/20"
          style={{ imageRendering: 'auto' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* 悬停信息 */}
        {hoverInfo && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none absolute top-2 left-2 rounded bg-black/80 px-2 py-1 text-xs text-white backdrop-blur-sm"
          >
            <div>
              {t('histogram.value')}: {hoverInfo.value}
            </div>
            {channelVisibility.red && (
              <div className="text-red">
                R: {hoverInfo.channels.red.toFixed(2)}
              </div>
            )}
            {channelVisibility.green && (
              <div className="text-green">
                G: {hoverInfo.channels.green.toFixed(2)}
              </div>
            )}
            {channelVisibility.blue && (
              <div className="text-blue">
                B: {hoverInfo.channels.blue.toFixed(2)}
              </div>
            )}
            {channelVisibility.luminance && (
              <div className="text-white">
                {t('histogram.luminance')}:{' '}
                {hoverInfo.channels.luminance.toFixed(2)}
              </div>
            )}
          </m.div>
        )}
      </div>

      {/* 控制面板 */}
      <div className="mt-2 space-y-2">
        {/* 通道切换 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleChannel('red')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-all ${
                channelVisibility.red
                  ? 'text-red border border-red-500/30 bg-red-500/20'
                  : 'border border-white/10 bg-white/5 text-white/40'
              }`}
            >
              <div
                className={`size-2 rounded-full ${channelVisibility.red ? 'bg-red' : 'bg-white/20'}`}
              />
              <span>R</span>
            </button>
            <button
              type="button"
              onClick={() => toggleChannel('green')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-all ${
                channelVisibility.green
                  ? 'border border-green-500/30 bg-green-500/20 text-green-400'
                  : 'border border-white/10 bg-white/5 text-white/40'
              }`}
            >
              <div
                className={`size-2 rounded-full ${channelVisibility.green ? 'bg-green' : 'bg-white/20'}`}
              />
              <span>G</span>
            </button>
            <button
              type="button"
              onClick={() => toggleChannel('blue')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-all ${
                channelVisibility.blue
                  ? 'border border-blue-500/30 bg-blue-500/20 text-blue-400'
                  : 'border border-white/10 bg-white/5 text-white/40'
              }`}
            >
              <div
                className={`size-2 rounded-full ${channelVisibility.blue ? 'bg-blue' : 'bg-white/20'}`}
              />
              <span>B</span>
            </button>
            <button
              type="button"
              onClick={() => toggleChannel('luminance')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-all ${
                channelVisibility.luminance
                  ? 'border border-white/30 bg-white/20 text-white'
                  : 'border border-white/10 bg-white/5 text-white/40'
              }`}
            >
              <div
                className={`size-2 rounded-full ${channelVisibility.luminance ? 'bg-white/80' : 'bg-white/20'}`}
              />
              <span>{t('histogram.luminance')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStats(!showStats)}
              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 transition-all hover:bg-white/10"
            >
              {t('histogram.statistics')}
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <AnimatePresence>
          {showStats && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded bg-black/20 text-xs text-white/80"
            >
              <div className="grid grid-cols-4 gap-2 p-2">
                <div className="text-center">
                  <div className="mb-1 text-white/60">
                    {t('histogram.channel')}
                  </div>
                  <div className="space-y-1">
                    {channelVisibility.luminance && (
                      <div className="text-white">
                        {t('histogram.luminance')}
                      </div>
                    )}
                    {channelVisibility.red && (
                      <div className="text-red-400">{t('histogram.red')}</div>
                    )}
                    {channelVisibility.green && (
                      <div className="text-green-400">
                        {t('histogram.green')}
                      </div>
                    )}
                    {channelVisibility.blue && (
                      <div className="text-blue-400">{t('histogram.blue')}</div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-white/60">
                    {t('histogram.mean')}
                  </div>
                  <div className="space-y-1">
                    {channelVisibility.luminance && (
                      <div>{stats.luminance.mean}</div>
                    )}
                    {channelVisibility.red && <div>{stats.red.mean}</div>}
                    {channelVisibility.green && <div>{stats.green.mean}</div>}
                    {channelVisibility.blue && <div>{stats.blue.mean}</div>}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-white/60">
                    {t('histogram.median')}
                  </div>
                  <div className="space-y-1">
                    {channelVisibility.luminance && (
                      <div>{stats.luminance.median}</div>
                    )}
                    {channelVisibility.red && <div>{stats.red.median}</div>}
                    {channelVisibility.green && <div>{stats.green.median}</div>}
                    {channelVisibility.blue && <div>{stats.blue.median}</div>}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-white/60">
                    {t('histogram.mode')}
                  </div>
                  <div className="space-y-1">
                    {channelVisibility.luminance && (
                      <div>{stats.luminance.mode}</div>
                    )}
                    {channelVisibility.red && <div>{stats.red.mode}</div>}
                    {channelVisibility.green && <div>{stats.green.mode}</div>}
                    {channelVisibility.blue && <div>{stats.blue.mode}</div>}
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
