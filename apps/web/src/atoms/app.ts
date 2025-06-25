import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type GallerySortBy = 'date'
export type GallerySortOrder = 'asc' | 'desc'

export const gallerySettingAtom = atomWithStorage('gallery-settings', {
  sortBy: 'date' as GallerySortBy,
  sortOrder: 'desc' as GallerySortOrder,
  selectedTags: [] as string[],
  columns: 'auto' as number | 'auto', // 自定义列数，auto 表示自动计算
})

export const isExiftoolLoadedAtom = atom(false)
