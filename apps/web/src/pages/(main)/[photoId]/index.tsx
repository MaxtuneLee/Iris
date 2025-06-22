import { RemoveScroll } from 'react-remove-scroll'

import { NotFound } from '~/components/common/NotFound'
import { PhotoViewer } from '~/components/ui/photo-viewer'
import { RootPortal } from '~/components/ui/portal'
import { useTitle } from '~/hooks/common'
import { usePhotos, usePhotoViewer } from '~/hooks/usePhotoViewer'

export const Component = () => {
  const photoViewer = usePhotoViewer()
  const photos = usePhotos()

  useTitle(photos[photoViewer.currentIndex]?.title || 'Not Found')
  if (!photos[photoViewer.currentIndex]) {
    return <NotFound />
  }

  return (
    <RootPortal>
      <RemoveScroll className="fixed inset-0 z-[9999]">
        <PhotoViewer
          photos={photos}
          currentIndex={photoViewer.currentIndex}
          isOpen={photoViewer.isOpen}
          onClose={photoViewer.closeViewer}
          onIndexChange={photoViewer.goToIndex}
        />
      </RemoveScroll>
    </RootPortal>
  )
}
