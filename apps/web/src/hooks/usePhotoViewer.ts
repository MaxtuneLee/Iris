import { photoLoader } from '@afilmory/data'
import { atom, useAtom, useAtomValue } from 'jotai'
import { useCallback, useMemo } from 'react'

import { gallerySettingAtom } from '~/atoms/app'

const openAtom = atom(false)
const currentIndexAtom = atom(0)
const triggerElementAtom = atom<HTMLElement | null>(null)
const data = photoLoader.getPhotos()
export const usePhotos = () => {
  const { sortOrder, selectedTags } = useAtomValue(gallerySettingAtom)

  const masonryItems = useMemo(() => {
    // 首先根据 tags 筛选
    let filteredPhotos = data
    if (selectedTags.length > 0) {
      filteredPhotos = data.filter((photo) =>
        selectedTags.some((tag) => photo.tags.includes(tag)),
      )
    }

    // 然后排序
    const sortedPhotos = filteredPhotos.toSorted((a, b) => {
      let aDateStr = ''
      let bDateStr = ''

      if (a.exif && a.exif.DateTimeOriginal) {
        aDateStr = a.exif.DateTimeOriginal as unknown as string
      } else {
        aDateStr = a.lastModified
      }

      if (b.exif && b.exif.DateTimeOriginal) {
        bDateStr = b.exif.DateTimeOriginal as unknown as string
      } else {
        bDateStr = b.lastModified
      }

      return sortOrder === 'asc'
        ? aDateStr.localeCompare(bDateStr)
        : bDateStr.localeCompare(aDateStr)
    })

    return sortedPhotos
  }, [sortOrder, selectedTags])
  return masonryItems
}
export const usePhotoViewer = () => {
  const photos = usePhotos()
  const [isOpen, setIsOpen] = useAtom(openAtom)
  const [currentIndex, setCurrentIndex] = useAtom(currentIndexAtom)
  const [triggerElement, setTriggerElement] = useAtom(triggerElementAtom)

  const openViewer = useCallback(
    (index: number, element?: HTMLElement) => {
      setCurrentIndex(index)
      setTriggerElement(element || null)
      setIsOpen(true)
      // 防止背景滚动
      document.body.style.overflow = 'hidden'
    },
    [setCurrentIndex, setIsOpen, setTriggerElement],
  )

  const closeViewer = useCallback(() => {
    setIsOpen(false)
    setTriggerElement(null)
    // 恢复背景滚动
    document.body.style.overflow = ''
  }, [setIsOpen, setTriggerElement])

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, photos.length, setCurrentIndex])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex, setCurrentIndex])

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < photos.length) {
        setCurrentIndex(index)
      }
    },
    [photos.length, setCurrentIndex],
  )

  return {
    isOpen,
    currentIndex,
    triggerElement,
    openViewer,
    closeViewer,
    goToNext,
    goToPrevious,
    goToIndex,
  }
}
