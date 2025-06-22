import { photoLoader } from '@afilmory/data'
import { useAtom } from 'jotai'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { gallerySettingAtom } from '~/atoms/app'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Slider } from '~/components/ui/slider'
import { useMobile } from '~/hooks/useMobile'

const allTags = photoLoader.getAllTags()

export const ActionGroup = () => {
  const { t } = useTranslation()
  const [gallerySetting, setGallerySetting] = useAtom(gallerySettingAtom)

  const setSortOrder = (order: 'asc' | 'desc') => {
    setGallerySetting({
      ...gallerySetting,
      sortOrder: order,
    })
  }

  const toggleTag = (tag: string) => {
    const newSelectedTags = gallerySetting.selectedTags.includes(tag)
      ? gallerySetting.selectedTags.filter((t) => t !== tag)
      : [...gallerySetting.selectedTags, tag]

    setGallerySetting({
      ...gallerySetting,
      selectedTags: newSelectedTags,
    })
  }

  const clearAllTags = () => {
    setGallerySetting({
      ...gallerySetting,
      selectedTags: [],
    })
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {/* 标签筛选按钮 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative h-10 w-10 rounded-full border-0 bg-gray-100 transition-all duration-200 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            title={t('action.tag.filter')}
          >
            <i className="i-mingcute-tag-line text-base text-gray-600 dark:text-gray-300" />
            {gallerySetting.selectedTags.length > 0 && (
              <span className="bg-accent absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white shadow-sm">
                {gallerySetting.selectedTags.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="w-64">
          <DropdownMenuLabel className="relative">
            <span>标签筛选</span>
            {gallerySetting.selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={clearAllTags}
                className="absolute top-0 right-0 h-6 rounded-md px-2 text-xs"
              >
                清除
              </Button>
            )}
          </DropdownMenuLabel>

          {allTags.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              暂无标签
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {allTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={gallerySetting.selectedTags.includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AdjustColumnsButton />

      {/* 排序按钮 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full border-0 bg-gray-100 transition-all duration-200 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            title={t('action.sort.mode')}
          >
            {gallerySetting.sortOrder === 'desc' ? (
              <i className="i-mingcute-sort-descending-line text-base text-gray-600 dark:text-gray-300" />
            ) : (
              <i className="i-mingcute-sort-ascending-line text-base text-gray-600 dark:text-gray-300" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuLabel>排序方式</DropdownMenuLabel>

          <DropdownMenuCheckboxItem
            onClick={() => setSortOrder('desc')}
            icon={<i className="i-mingcute-sort-descending-line" />}
            checked={gallerySetting.sortOrder === 'desc'}
          >
            <span>最新优先</span>
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            onClick={() => setSortOrder('asc')}
            icon={<i className="i-mingcute-sort-ascending-line" />}
            checked={gallerySetting.sortOrder === 'asc'}
          >
            <span>最早优先</span>
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const AdjustColumnsButton = () => {
  const { t } = useTranslation()
  const [gallerySetting, setGallerySetting] = useAtom(gallerySettingAtom)
  const isMobile = useMobile()

  const setColumns = (columns: number | 'auto') => {
    setGallerySetting({
      ...gallerySetting,
      columns,
    })
  }
  // 根据设备类型提供不同的列数范围
  const columnRange = isMobile
    ? { min: 2, max: 4 } // 移动端适合的列数范围
    : { min: 2, max: 8 } // 桌面端适合的列数范围
  const dropdownMenuTriggerRef = useRef<HTMLButtonElement>(null)

  const [triggerRectPosition, setTriggerRectPosition] = useState<{
    top: number
    left: number
    height: number
    width: number
  } | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setTriggerRectPosition({
            top: rect.top,
            left: rect.left,
            height: rect.height,
            width: rect.width,
          })

          setOpen(true)
        }}
        variant="ghost"
        size="sm"
        className="relative h-10 w-10 rounded-full border-0 bg-gray-100 transition-all duration-200 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        title={t('action.columns.setting')}
      >
        <i className="i-mingcute-grid-line text-base text-gray-600 dark:text-gray-300" />
        {gallerySetting.columns !== 'auto' && (
          <span className="bg-accent absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white shadow-sm">
            {gallerySetting.columns}
          </span>
        )}
      </Button>

      {/* 列数控制按钮 */}
      <DropdownMenu
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            setTriggerRectPosition(null)
          }
          setOpen(open)
        }}
      >
        <DropdownMenuTrigger
          className={'fixed'}
          style={
            triggerRectPosition
              ? {
                  top: triggerRectPosition.top,
                  left: triggerRectPosition.left,
                  height: triggerRectPosition.height,
                  width: triggerRectPosition.width,
                }
              : undefined
          }
          ref={dropdownMenuTriggerRef}
        />

        <DropdownMenuContent align="center" className="w-80 p-2">
          <DropdownMenuLabel className="mb-3">
            {t('action.columns.setting')}
          </DropdownMenuLabel>

          <div className="px-2">
            <Slider
              value={gallerySetting.columns}
              onChange={setColumns}
              min={columnRange.min}
              max={columnRange.max}
              autoLabel={t('action.auto')}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
