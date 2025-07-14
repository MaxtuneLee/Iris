import { photoLoader } from '@afilmory/data'
import { atom, useAtom, useAtomValue } from 'jotai'
import { useCallback, useMemo } from 'react'

import { gallerySettingAtom } from '~/atoms/app'
import { jotaiStore } from '~/lib/jotai'
import { trackView } from '~/lib/tracker'

const openAtom = atom(false)
const currentIndexAtom = atom(0)
const triggerElementAtom = atom<HTMLElement | null>(null)
const data = photoLoader.getPhotos()

// 抽取照片筛选和排序逻辑为独立函数
const filterAndSortPhotos = (
  selectedTags: string[],
  sortOrder: 'asc' | 'desc',
) => {
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
}

// 提供一个 getter 函数供非 UI 组件使用
export const getFilteredPhotos = () => {
  // 直接从 jotaiStore 中读取当前状态
  const currentGallerySetting = jotaiStore.get(gallerySettingAtom)
  return filterAndSortPhotos(
    currentGallerySetting.selectedTags,
    currentGallerySetting.sortOrder,
  )
}

export const usePhotos = () => {
  const { sortOrder, selectedTags } = useAtomValue(gallerySettingAtom)

  const masonryItems = useMemo(() => {
    return filterAndSortPhotos(selectedTags, sortOrder)
  }, [sortOrder, selectedTags])

  return masonryItems
}

export const usePhotoViewer = () => {
  const photos = usePhotos()
  const [isOpen, setIsOpen] = useAtom(openAtom)
  const [currentIndex, setCurrentIndex] = useAtom(currentIndexAtom)
  const [triggerElement, setTriggerElement] = useAtom(triggerElementAtom)

  const id = useMemo(() => {
    return photos[currentIndex].id
  }, [photos, currentIndex])
  const openViewer = useCallback(
    (index: number, element?: HTMLElement) => {
      setCurrentIndex(index)
      setTriggerElement(element || null)
      setIsOpen(true)
      // 防止背景滚动
      document.body.style.overflow = 'hidden'

      trackView(id)
    },
    [id, setCurrentIndex, setIsOpen, setTriggerElement],
  )

  const closeViewer = useCallback(() => {
    setIsOpen(false)
    setTriggerElement(null)
    // 恢复背景滚动
    document.body.style.overflow = ''
  }, [setIsOpen, setTriggerElement])

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < photos.length) {
        setCurrentIndex(index)
        trackView(photos[index].id)
      }
    },
    [photos, setCurrentIndex],
  )

  return {
    isOpen,
    currentIndex,
    triggerElement,
    openViewer,
    closeViewer,

    goToIndex,
  }
}
