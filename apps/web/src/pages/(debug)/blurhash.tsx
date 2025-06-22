import { photoLoader } from '@afilmory/data'
import { Blurhash } from 'react-blurhash'

export const Component = () => {
  const photos = photoLoader.getPhotos()

  return (
    <div className="columns-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative"
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
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
            <Blurhash
              hash={photo.blurhash}
              width="100%"
              height="100%"
              resolutionX={32}
              resolutionY={32}
              punch={1}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
