import { useEffect, useState } from 'react'

import type { TocItem } from '../toc-data'
import { getTocByPath } from '../toc-data'

interface TableOfContentsProps {
  currentPath: string
  onItemClick?: () => void
  handleScroll?: (top: number) => void
}

interface TocItemProps {
  item: TocItem
  activeId: string | null
  level: number
  onItemClick?: () => void
  handleScroll?: (top: number) => void
}

function TocItemComponent({
  item,
  activeId,
  level,
  onItemClick,
  handleScroll,
}: TocItemProps) {
  const isActive = activeId === item.id
  const hasChildren = item.children && item.children.length > 0

  return (
    <li className="relative">
      <a
        href={`#${item.id}`}
        className={`
          block py-1 text-[12px] transition-colors duration-200
          ${
            isActive
              ? 'border-l-2 border-blue-600 pl-3 font-medium text-blue-600'
              : 'pl-3 text-gray-500 hover:text-gray-900'
          }
          ${level > 1 ? `ml-${(level - 1) * 4}` : ''}
        `}
        onClick={(e) => {
          e.preventDefault()
          const element = document.querySelector(`#${item.id}`)
          if (element && element instanceof HTMLElement) {
            const elementTop = element.offsetTop
            console.info('Navigating to:', element, 'Top:', elementTop)
            handleScroll?.(elementTop - 74)
          }
          onItemClick?.()
        }}
      >
        {item.text}
      </a>

      {hasChildren && (
        <ul className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <TocItemComponent
              key={child.id}
              item={child}
              activeId={activeId}
              level={level + 1}
              onItemClick={onItemClick}
              handleScroll={handleScroll}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function TableOfContents({
  currentPath,
  onItemClick,
  handleScroll,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // 获取当前页面的 TOC 数据
  const currentToc = getTocByPath(currentPath)

  // 监听滚动，高亮当前标题
  useEffect(() => {
    if (!currentToc || currentToc.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // 找到可见的标题中最上面的一个
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          // 按照在页面中的位置排序，选择最上面的
          visibleEntries.sort((a, b) => {
            const aRect = a.boundingClientRect
            const bRect = b.boundingClientRect
            return aRect.top - bRect.top
          })
          setActiveId(visibleEntries[0].target.id)
        }
      },
      {
        rootMargin: '-20px 0px -80% 0px',
        threshold: 0.1,
      },
    )

    // 获取所有标题ID（包括嵌套的）
    const getAllIds = (items: TocItem[]): string[] => {
      const ids: string[] = []
      for (const item of items) {
        ids.push(item.id)
        if (item.children) {
          ids.push(...getAllIds(item.children))
        }
      }
      return ids
    }

    const allIds = getAllIds(currentToc)

    // 观察所有标题元素
    allIds.forEach((id) => {
      const element = document.querySelector(`#${id}`)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [currentToc])

  // 如果当前页面没有TOC数据，不显示
  if (!currentToc || currentToc.length === 0) {
    return null
  }

  return (
    <div className="border-separator mb-4 border-l-2">
      <nav>
        <ul className="translate-x-[-2px] space-y-1">
          {currentToc.map((item) => (
            <TocItemComponent
              key={item.id}
              item={item}
              activeId={activeId}
              level={1}
              onItemClick={onItemClick}
              handleScroll={handleScroll}
            />
          ))}
        </ul>
      </nav>
    </div>
  )
}
