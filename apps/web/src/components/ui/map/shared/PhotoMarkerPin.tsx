import { m } from 'motion/react'
import { Marker } from 'react-map-gl/maplibre'
import { Link } from 'react-router'

import { GlassButton } from '~/components/ui/button/GlassButton'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card'
import { LazyImage } from '~/components/ui/lazy-image'

import type { PhotoMarkerPinProps } from './types'

export const PhotoMarkerPin = ({
  marker,
  isSelected = false,
  onClick,
  onClose,
}: PhotoMarkerPinProps) => {
  const handleClick = () => {
    onClick?.(marker)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose?.()
  }

  return (
    <Marker
      key={marker.id}
      longitude={marker.longitude}
      latitude={marker.latitude}
    >
      <HoverCard openDelay={400} closeDelay={100}>
        <HoverCardTrigger asChild>
          <m.div
            className="group relative cursor-pointer"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
          >
            {/* Selection ring */}
            {isSelected && (
              <div className="bg-blue/30 absolute inset-0 -m-2 animate-pulse rounded-full" />
            )}

            {/* Photo background preview */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <LazyImage
                src={marker.photo.thumbnailUrl || marker.photo.originalUrl}
                alt={marker.photo.title || marker.photo.id}
                thumbHash={marker.photo.thumbHash}
                className="h-full w-full object-cover opacity-40"
                rootMargin="100px"
                threshold={0.1}
              />
              {/* Overlay */}
              <div className="from-green/60 to-emerald/80 dark:from-green/70 dark:to-emerald/90 absolute inset-0 bg-gradient-to-br" />
            </div>

            {/* Main marker container */}
            <div
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-xl ${
                isSelected
                  ? 'border-blue/40 bg-blue/90 shadow-blue/50 dark:border-blue/30 dark:bg-blue/80'
                  : 'border-white/40 bg-white/95 hover:bg-white dark:border-white/20 dark:bg-black/80 dark:hover:bg-black/90'
              }`}
            >
              {/* Glass morphism overlay */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-white/10 dark:from-white/20 dark:to-white/5" />

              {/* Camera icon */}
              <i
                className={`i-mingcute-camera-line relative z-10 text-lg drop-shadow-sm ${
                  isSelected ? 'text-white' : 'text-gray-700 dark:text-white'
                }`}
              />

              {/* Subtle inner shadow for depth */}
              <div className="absolute inset-0 rounded-full shadow-inner shadow-black/5" />
            </div>
          </m.div>
        </HoverCardTrigger>

        <HoverCardContent
          className="w-80 overflow-hidden border-white/20 bg-white/95 p-0 backdrop-blur-[120px] dark:bg-black/95"
          side="top"
          align="center"
          sideOffset={8}
        >
          <div className="relative">
            {/* Photo header */}
            <div className="relative h-32 overflow-hidden">
              <LazyImage
                src={marker.photo.thumbnailUrl || marker.photo.originalUrl}
                alt={marker.photo.title || marker.photo.id}
                thumbHash={marker.photo.thumbHash}
                className="h-full w-full object-cover"
                rootMargin="200px"
                threshold={0.1}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Content */}
            <div className="space-y-3 p-4">
              {/* Title with link */}
              <Link
                to={`/${marker.photo.id}`}
                target="_blank"
                className="group/link hover:text-blue flex items-center gap-2 transition-colors"
              >
                <h3
                  className="text-text flex-1 truncate text-sm font-semibold"
                  title={marker.photo.title || marker.photo.id}
                >
                  {marker.photo.title || marker.photo.id}
                </h3>
                <i className="i-mingcute-arrow-right-line text-text-secondary transition-transform group-hover/link:translate-x-0.5" />
              </Link>

              {/* Metadata */}
              <div className="space-y-2">
                {marker.photo.exif?.DateTimeOriginal && (
                  <div className="text-text-secondary flex items-center gap-2 text-xs">
                    <i className="i-mingcute-calendar-line text-sm" />
                    <span>
                      {new Date(
                        marker.photo.exif.DateTimeOriginal,
                      ).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {marker.photo.exif?.Make && marker.photo.exif?.Model && (
                  <div className="text-text-secondary flex items-center gap-2 text-xs">
                    <i className="i-mingcute-camera-line text-sm" />
                    <span className="truncate">
                      {marker.photo.exif.Make} {marker.photo.exif.Model}
                    </span>
                  </div>
                )}

                <div className="text-text-secondary space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <i className="i-mingcute-location-line text-sm" />
                    <span className="font-mono">
                      {Math.abs(marker.latitude).toFixed(4)}°
                      {marker.latitudeRef || 'N'},{' '}
                      {Math.abs(marker.longitude).toFixed(4)}°
                      {marker.longitudeRef || 'E'}
                    </span>
                  </div>
                  {marker.altitude !== undefined && (
                    <div className="flex items-center gap-2">
                      <i className="i-mingcute-mountain-2-line text-sm" />
                      <span className="font-mono">
                        {marker.altitudeRef === 'Below Sea Level' ? '-' : ''}
                        {Math.abs(marker.altitude).toFixed(1)}m
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>

      {/* Enhanced popup for selected state */}
      {isSelected && (
        <m.div
          className="absolute -top-80 left-1/2 z-50 -translate-x-1/2 transform"
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="border-fill-tertiary bg-material-thick relative w-72 cursor-default overflow-hidden rounded-xl border shadow-2xl backdrop-blur-[80px]">
            {/* Close button */}
            <GlassButton
              className="absolute top-3 right-3 z-10 size-8"
              onClick={handleClose}
            >
              <i className="i-mingcute-close-line text-lg" />
            </GlassButton>

            {/* Photo container */}
            <div className="relative overflow-hidden">
              <LazyImage
                src={marker.photo.thumbnailUrl || marker.photo.originalUrl}
                alt={marker.photo.title || marker.photo.id}
                thumbHash={marker.photo.thumbHash}
                className="h-40 w-full object-cover"
                rootMargin="200px"
                threshold={0.1}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 p-4">
              {/* Title with link */}
              <Link
                to={`/${marker.photo.id}`}
                target="_blank"
                className="group/link hover:text-blue flex items-center gap-2 transition-colors"
              >
                <h3
                  className="text-text flex-1 truncate text-base font-semibold"
                  title={marker.photo.title || marker.photo.id}
                >
                  {marker.photo.title || marker.photo.id}
                </h3>
                <i className="i-mingcute-arrow-right-line" />
              </Link>

              {/* Metadata */}
              <div className="space-y-2">
                {marker.photo.exif?.DateTimeOriginal && (
                  <div className="text-text-secondary flex items-center gap-2 text-sm">
                    <i className="i-mingcute-calendar-line" />
                    <span className="text-xs">
                      {new Date(
                        marker.photo.exif.DateTimeOriginal,
                      ).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {marker.photo.exif?.Make && marker.photo.exif?.Model && (
                  <div className="text-text-secondary flex items-center gap-2 text-sm">
                    <i className="i-mingcute-camera-line" />
                    <span className="truncate text-xs">
                      {marker.photo.exif.Make} {marker.photo.exif.Model}
                    </span>
                  </div>
                )}

                <div className="text-text-secondary space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <i className="i-mingcute-location-line" />
                    <span className="font-mono text-xs">
                      {Math.abs(marker.latitude).toFixed(6)}°
                      {marker.latitudeRef || 'N'},{' '}
                      {Math.abs(marker.longitude).toFixed(6)}°
                      {marker.longitudeRef || 'E'}
                    </span>
                  </div>
                  {marker.altitude !== undefined && (
                    <div className="flex items-center gap-2">
                      <i className="i-mingcute-mountain-2-line" />
                      <span className="font-mono text-xs">
                        {marker.altitudeRef === 'Below Sea Level' ? '-' : ''}
                        {Math.abs(marker.altitude).toFixed(1)}m
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </Marker>
  )
}
