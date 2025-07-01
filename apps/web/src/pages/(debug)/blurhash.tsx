import { photoLoader } from '@afilmory/data'

import { ScrollArea } from '~/components/ui/scroll-areas/ScrollArea'
import { Thumbhash } from '~/components/ui/thumbhash'

export const Component = () => {
  const photos = photoLoader.getPhotos()

  return (
    <ScrollArea rootClassName="h-screen">
      <div className="columns-4 gap-0">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative m-2"
            style={{
              paddingBottom: `${(photo.height / photo.width) * 100}%`,
            }}
          >
            <img
              src={photo.thumbnailUrl}
              alt={photo.title}
              height={photo.height}
              width={photo.width}
              className="absolute inset-0"
            />
            {photo.thumbHash && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
                <Thumbhash thumbHash={photo.thumbHash} />
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
