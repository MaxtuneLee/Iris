import { m, useAnimationControls } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { clsxm } from '~/lib/cn'
import { isMobileDevice } from '~/lib/device-viewport'
import type { ImageLoaderManager } from '~/lib/image-loader-manager'
import { isWebCodecsSupported } from '~/lib/video-converter'

import type { LoadingIndicatorRef } from './LoadingIndicator'

interface LivePhotoProps {
  /** Live Photo 视频 URL */
  videoUrl: string
  /** 图片加载管理器实例 */
  imageLoaderManager: ImageLoaderManager
  /** 加载指示器引用 */
  loadingIndicatorRef: React.RefObject<LoadingIndicatorRef | null>
  /** 是否是当前图片 */
  isCurrentImage: boolean
  /** 自定义样式类名 */
  className?: string
}

export const LivePhoto = ({
  videoUrl,
  imageLoaderManager,
  loadingIndicatorRef,
  isCurrentImage,
  className,
}: LivePhotoProps) => {
  const { t } = useTranslation()

  // Live Photo 相关状态
  const [isPlayingLivePhoto, setIsPlayingLivePhoto] = useState(false)
  const [livePhotoVideoLoaded, setLivePhotoVideoLoaded] = useState(false)
  const [isConvertingVideo, setIsConvertingVideo] = useState(false)
  const [conversionMethod, setConversionMethod] = useState<string>('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const videoAnimateController = useAnimationControls()

  // Live Photo hover 相关
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  useEffect(() => {
    if (
      !isCurrentImage ||
      livePhotoVideoLoaded ||
      isConvertingVideo ||
      !videoRef.current
    ) {
      return
    }

    setIsConvertingVideo(true)

    const processVideo = async () => {
      try {
        const videoResult = await imageLoaderManager.processLivePhotoVideo(
          videoUrl,
          videoRef.current!,
          {
            onLoadingStateUpdate: (state) => {
              loadingIndicatorRef.current?.updateLoadingState(state)
            },
          },
        )

        if (videoResult.conversionMethod) {
          setConversionMethod(videoResult.conversionMethod)
        }

        setLivePhotoVideoLoaded(true)
      } catch (videoError) {
        console.error('Failed to process Live Photo video:', videoError)
      } finally {
        setIsConvertingVideo(false)
      }
    }

    processVideo()
  }, [
    isCurrentImage,
    livePhotoVideoLoaded,
    isConvertingVideo,
    videoUrl,
    imageLoaderManager,
    loadingIndicatorRef,
  ])

  // 清理函数
  useEffect(() => {
    return () => {
      // Clean up timers
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }, [])

  // 重置状态（当不是当前图片时）
  useEffect(() => {
    if (!isCurrentImage) {
      setIsPlayingLivePhoto(false)
      setLivePhotoVideoLoaded(false)
      setIsConvertingVideo(false)
      setConversionMethod('')
      setIsLongPressing(false)

      // Clean up timers
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      // Reset video animation
      videoAnimateController.set({ opacity: 0 })
    }
  }, [isCurrentImage, videoAnimateController])

  // Live Photo hover 处理
  const handleBadgeMouseEnter = useCallback(() => {
    if (!livePhotoVideoLoaded || isPlayingLivePhoto || isConvertingVideo) return

    hoverTimerRef.current = setTimeout(async () => {
      setIsPlayingLivePhoto(true)

      // 开始淡入动画
      await videoAnimateController.start({
        opacity: 1,
        transition: { duration: 0.15, ease: 'easeOut' },
      })

      const video = videoRef.current
      if (video) {
        video.currentTime = 0
        video.play()
      }
    }, 200) // 200ms hover 延迟
  }, [
    livePhotoVideoLoaded,
    isPlayingLivePhoto,
    isConvertingVideo,
    videoAnimateController,
  ])

  const handleBadgeMouseLeave = useCallback(async () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }

    if (isPlayingLivePhoto) {
      const video = videoRef.current
      if (video) {
        video.pause()
        video.currentTime = 0
      }

      // 开始淡出动画
      await videoAnimateController.start({
        opacity: 0,
        transition: { duration: 0.2, ease: 'easeIn' },
      })

      setIsPlayingLivePhoto(false)
    }
  }, [isPlayingLivePhoto, videoAnimateController])

  // 视频播放结束处理
  const handleVideoEnded = useCallback(async () => {
    // 播放结束时淡出
    await videoAnimateController.start({
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' },
    })

    setIsPlayingLivePhoto(false)
  }, [videoAnimateController])

  // Live Photo 长按处理（移动端）
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (
        !livePhotoVideoLoaded ||
        isPlayingLivePhoto ||
        isConvertingVideo ||
        e.touches.length > 1 // 多指触摸不触发长按
      )
        return

      longPressTimerRef.current = setTimeout(async () => {
        setIsLongPressing(true)
        setIsPlayingLivePhoto(true)

        // 开始淡入动画
        await videoAnimateController.start({
          opacity: 1,
          transition: { duration: 0.15, ease: 'easeOut' },
        })

        const video = videoRef.current
        if (video) {
          video.currentTime = 0
          video.play()
        }
      }, 500) // 500ms 长按延迟
    },
    [
      livePhotoVideoLoaded,
      isPlayingLivePhoto,
      isConvertingVideo,
      videoAnimateController,
    ],
  )

  const handleTouchEnd = useCallback(async () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (isLongPressing && isPlayingLivePhoto) {
      setIsLongPressing(false)

      const video = videoRef.current
      if (video) {
        video.pause()
        video.currentTime = 0
      }

      // 开始淡出动画
      await videoAnimateController.start({
        opacity: 0,
        transition: { duration: 0.2, ease: 'easeIn' },
      })

      setIsPlayingLivePhoto(false)
    }
  }, [isLongPressing, isPlayingLivePhoto, videoAnimateController])

  const handleTouchMove = useCallback(() => {
    // 触摸移动时取消长按
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  return (
    <>
      {/* Live Photo 视频 */}
      <m.video
        ref={videoRef}
        className={clsxm(
          'absolute inset-0 z-10 h-full w-full object-contain',
          !isPlayingLivePhoto && 'hidden',
          className,
        )}
        muted
        playsInline
        onEnded={handleVideoEnded}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        initial={{ opacity: 0 }}
        animate={videoAnimateController}
      />

      {/* Live Photo 标识 */}
      <div
        className={clsxm(
          'absolute z-50 flex items-center space-x-1 rounded-xl bg-black/50 px-1 py-1 text-xs text-white cursor-pointer transition-all duration-200 hover:bg-black/70',
          import.meta.env.DEV ? 'top-16 right-4' : 'top-12 lg:top-4 left-4',
        )}
        onMouseEnter={handleBadgeMouseEnter}
        onMouseLeave={handleBadgeMouseLeave}
        title={
          isMobileDevice
            ? t('photo.live.tooltip.mobile.main')
            : t('photo.live.tooltip.desktop.main')
        }
      >
        {isConvertingVideo ? (
          <div className="flex items-center gap-1 px-1">
            <i className="i-mingcute-loading-line animate-spin" />
            <span>{t('photo.live.converting.video')}</span>
          </div>
        ) : (
          <>
            <i className="i-mingcute-live-photo-line size-4" />
            <span className="mr-1">{t('photo.live.badge')}</span>
            {conversionMethod && (
              <span className="rounded bg-white/20 px-1 text-xs">
                {conversionMethod === 'webcodecs' ? 'WebCodecs' : ''}
              </span>
            )}
          </>
        )}
      </div>

      {/* 操作提示 */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-0 duration-200 group-hover:opacity-50">
        {isConvertingVideo
          ? t('photo.live.converting.detail', {
              method: isWebCodecsSupported() ? 'WebCodecs' : '',
            })
          : isMobileDevice
            ? t('photo.live.tooltip.mobile.zoom')
            : t('photo.live.tooltip.desktop.zoom')}
      </div>
    </>
  )
}
