import { WebGLImageViewer } from '@afilmory/webgl-viewer'
import { AnimatePresence, m } from 'motion/react'
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  MenuItemSeparator,
  MenuItemText,
  useShowContextMenu,
} from '~/atoms/context-menu'
import { clsxm } from '~/lib/cn'
import { canUseWebGL } from '~/lib/feature'
import { ImageLoaderManager } from '~/lib/image-loader-manager'

import { SlidingNumber } from '../number/SlidingNumber'
import { LivePhoto } from './LivePhoto'
import type { LoadingIndicatorRef } from './LoadingIndicator'
import { LoadingIndicator } from './LoadingIndicator'

interface ProgressiveImageProps {
  src: string
  thumbnailSrc?: string

  alt: string
  width?: number
  height?: number
  className?: string
  onError?: () => void
  onProgress?: (progress: number) => void
  onZoomChange?: (isZoomed: boolean) => void
  onBlobSrcChange?: (blobSrc: string | null) => void

  enableZoom?: boolean
  enablePan?: boolean
  maxZoom?: number
  minZoom?: number

  isCurrentImage?: boolean

  // Live Photo 相关 props
  isLivePhoto?: boolean
  livePhotoVideoUrl?: string
}

export const ProgressiveImage = ({
  src,
  thumbnailSrc,

  alt,
  width,
  height,
  className,

  onError,
  onProgress,
  onZoomChange,
  onBlobSrcChange,

  maxZoom = 20,
  minZoom = 1,
  isCurrentImage = false,

  // Live Photo props
  isLivePhoto = false,
  livePhotoVideoUrl,
}: ProgressiveImageProps) => {
  const { t } = useTranslation()
  const [blobSrc, setBlobSrc] = useState<string | null>(null)
  const [highResLoaded, setHighResLoaded] = useState(false)
  const [error, setError] = useState(false)

  const thumbnailRef = useRef<HTMLImageElement>(null)

  const [isHighResImageRendered, setIsHighResImageRendered] = useState(false)

  // 缩放倍率提示相关状态
  const [currentScale, setCurrentScale] = useState(1)
  const [showScaleIndicator, setShowScaleIndicator] = useState(false)
  const scaleIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadingIndicatorRef = useRef<LoadingIndicatorRef>(null)
  const imageLoaderManagerRef = useRef<ImageLoaderManager | null>(null)

  useEffect(() => {
    if (highResLoaded || error || !isCurrentImage) return

    // Create new image loader manager
    const imageLoaderManager = new ImageLoaderManager()
    imageLoaderManagerRef.current = imageLoaderManager

    function cleanup() {
      setHighResLoaded(false)
      setBlobSrc(null)
      setError(false)
      onBlobSrcChange?.(null)
      setIsHighResImageRendered(false)

      // Reset loading indicator
      loadingIndicatorRef.current?.resetLoadingState()
    }

    const loadImage = async () => {
      try {
        const result = await imageLoaderManager.loadImage(src, {
          onProgress,
          onError,
          onLoadingStateUpdate: (state) => {
            loadingIndicatorRef.current?.updateLoadingState(state)
          },
        })

        setBlobSrc(result.blobSrc)
        onBlobSrcChange?.(result.blobSrc)
        setHighResLoaded(true)
      } catch (loadError) {
        console.error('Failed to load image:', loadError)
        setError(true)
      }
    }

    cleanup()
    loadImage()

    return () => {
      imageLoaderManager.cleanup()
    }
  }, [
    highResLoaded,
    error,
    onProgress,
    src,
    onError,
    isCurrentImage,
    onBlobSrcChange,
  ])

  const onTransformed = useCallback(
    (originalScale: number, relativeScale: number) => {
      const isZoomed = Math.abs(relativeScale - 1) > 0.01

      // 更新缩放倍率并显示提示
      startTransition(() => {
        setCurrentScale(originalScale)
        setShowScaleIndicator(true)
      })

      // 清除之前的定时器
      if (scaleIndicatorTimeoutRef.current) {
        clearTimeout(scaleIndicatorTimeoutRef.current)
      }

      // 设置新的定时器，500ms 后隐藏提示
      scaleIndicatorTimeoutRef.current = setTimeout(() => {
        setShowScaleIndicator(false)
      }, 500)

      onZoomChange?.(isZoomed)
    },
    [onZoomChange],
  )

  const handleWebGLLoadingStateChange = useCallback(
    (
      isLoading: boolean,
      message?: string,
      quality?: 'high' | 'medium' | 'low' | 'unknown',
    ) => {
      loadingIndicatorRef.current?.updateLoadingState({
        isVisible: isLoading,
        isWebGLLoading: isLoading,
        webglMessage: message,
        webglQuality: quality,
      })
    },
    [],
  )

  const [isThumbnailLoaded, setIsThumbnailLoaded] = useState(false)

  const handleThumbnailLoad = useCallback(() => {
    setIsThumbnailLoaded(true)
  }, [])

  const showContextMenu = useShowContextMenu()

  if (error) {
    return (
      <div
        className={clsxm(
          'flex items-center justify-center bg-material-opaque',
          className,
        )}
      >
        <div className="text-text-secondary text-center">
          <i className="i-mingcute-image-line mb-2 text-4xl" />
          <p className="text-sm">{t('photo.error.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={clsxm('relative overflow-hidden', className)}>
      {/* 缩略图 */}
      {thumbnailSrc && !isHighResImageRendered && (
        <img
          ref={thumbnailRef}
          src={thumbnailSrc}
          key={thumbnailSrc}
          alt={alt}
          className={clsxm(
            'absolute inset-0 h-full w-full object-contain transition-opacity duration-300',
            isThumbnailLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={handleThumbnailLoad}
        />
      )}

      {highResLoaded && blobSrc && isCurrentImage && (
        <WebGLImageViewer
          src={blobSrc}
          className="absolute inset-0 h-full w-full"
          width={width}
          height={height}
          initialScale={1}
          minScale={minZoom}
          maxScale={maxZoom}
          limitToBounds={true}
          centerOnInit={true}
          smooth={true}
          onZoomChange={onTransformed}
          onLoadingStateChange={handleWebGLLoadingStateChange}
          debug={import.meta.env.DEV}
          onContextMenu={(e) =>
            showContextMenu(
              [
                new MenuItemText({
                  label: t('photo.copy.image'),
                  click: async () => {
                    const loadingToast = toast.loading(t('photo.copying'))

                    try {
                      // Create a canvas to convert the image to PNG
                      const img = new Image()
                      img.crossOrigin = 'anonymous'

                      await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = blobSrc
                      })

                      const canvas = document.createElement('canvas')
                      const ctx = canvas.getContext('2d')
                      canvas.width = img.naturalWidth
                      canvas.height = img.naturalHeight

                      ctx?.drawImage(img, 0, 0)

                      // Convert to PNG blob
                      await new Promise<void>((resolve, reject) => {
                        canvas.toBlob(async (pngBlob) => {
                          try {
                            if (pngBlob) {
                              await navigator.clipboard.write([
                                new ClipboardItem({
                                  'image/png': pngBlob,
                                }),
                              ])
                              resolve()
                            } else {
                              reject(
                                new Error('Failed to convert image to PNG'),
                              )
                            }
                          } catch (error) {
                            reject(error)
                          }
                        }, 'image/png')
                      })

                      toast.dismiss(loadingToast)
                      toast.success(t('photo.copy.success'))
                    } catch (error) {
                      console.error('Failed to copy image:', error)

                      // Fallback: try to copy the original blob
                      try {
                        const blob = await fetch(blobSrc).then((res) =>
                          res.blob(),
                        )
                        await navigator.clipboard.write([
                          new ClipboardItem({
                            [blob.type]: blob,
                          }),
                        ])
                        toast.dismiss(loadingToast)
                        toast.success(t('photo.copy.success'))
                      } catch (fallbackError) {
                        console.error(
                          'Fallback copy also failed:',
                          fallbackError,
                        )
                        toast.dismiss(loadingToast)
                        toast.error(t('photo.copy.error'))
                      }
                    }
                  },
                }),
                MenuItemSeparator.default,
                new MenuItemText({
                  label: t('photo.download'),
                  click: () => {
                    const a = document.createElement('a')
                    a.href = blobSrc
                    a.download = alt
                    a.click()
                  },
                }),
              ],
              e,
            )
          }
        />
      )}

      {/* Live Photo 组件 */}
      {isLivePhoto &&
        livePhotoVideoUrl &&
        isCurrentImage &&
        imageLoaderManagerRef.current && (
          <LivePhoto
            videoUrl={livePhotoVideoUrl}
            imageLoaderManager={imageLoaderManagerRef.current}
            loadingIndicatorRef={loadingIndicatorRef}
            isCurrentImage={isCurrentImage}
          />
        )}

      {/* 备用图片（当 WebGL 不可用时） */}
      {!canUseWebGL && highResLoaded && blobSrc && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/20">
          <i className="i-mingcute-warning-line mb-2 text-4xl" />
          <span className="text-center text-sm text-white">
            {t('photo.webgl.unavailable')}
          </span>
        </div>
      )}

      {/* 加载指示器 */}
      <LoadingIndicator ref={loadingIndicatorRef} />

      {/* 操作提示 */}
      {!isLivePhoto && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-0 duration-200 group-hover:opacity-50">
          {t('photo.zoom.hint')}
        </div>
      )}

      {/* 缩放倍率提示 */}
      <AnimatePresence>
        {showScaleIndicator && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-0.5 rounded bg-black/50 px-3 py-1 text-lg text-white"
          >
            <SlidingNumber number={currentScale} decimalPlaces={1} />x
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// const DOMImageViewer: FC<{
//   onZoomChange?: (isZoomed: boolean) => any
//   minZoom: number
//   maxZoom: number
//   src: string
//   alt: string
//   highResLoaded: boolean
//   onLoad?: () => void
// }> = ({ onZoomChange, minZoom, maxZoom, src, alt, highResLoaded, onLoad }) => {
//   const onTransformed = useCallback(
//     (
//       ref: ReactZoomPanPinchRef,
//       state: Omit<ReactZoomPanPinchState, 'previousScale'>,
//     ) => {
//       // 当缩放比例不等于 1 时，认为图片被缩放了
//       const isZoomed = state.scale !== 1
//       onZoomChange?.(isZoomed)
//     },
//     [onZoomChange],
//   )
//   const transformRef = useRef<ReactZoomPanPinchRef>(null)

//   useEffect(() => {
//     if (transformRef.current) {
//       transformRef.current.resetTransform()
//     }
//   }, [src])

//   return (
//     <TransformWrapper
//       ref={transformRef}
//       initialScale={1}
//       minScale={minZoom}
//       maxScale={maxZoom}
//       wheel={{
//         step: 0.1,
//       }}
//       pinch={{
//         step: 0.5,
//       }}
//       doubleClick={{
//         step: 2,
//         mode: 'toggle',
//         animationTime: 200,
//         animationType: 'easeInOutCubic',
//       }}
//       limitToBounds={true}
//       centerOnInit={true}
//       smooth={true}
//       alignmentAnimation={{
//         sizeX: 0,
//         sizeY: 0,
//         velocityAlignmentTime: 0.2,
//       }}
//       velocityAnimation={{
//         sensitivity: 1,
//         animationTime: 0.2,
//       }}
//       onTransformed={onTransformed}
//     >
//       <TransformComponent
//         wrapperClass="!w-full !h-full !absolute !inset-0"
//         contentClass="!w-full !h-full flex items-center justify-center"
//       >
//         <img
//           src={src || undefined}
//           alt={alt}
//           className={clsxm(
//             'absolute inset-0 w-full h-full object-contain',
//             highResLoaded ? 'opacity-100' : 'opacity-0',
//           )}
//           draggable={false}
//           loading="eager"
//           decoding="async"
//           onLoad={onLoad}
//         />
//       </TransformComponent>
//     </TransformWrapper>
//   )
// }
