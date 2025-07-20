import { ChevronRight } from 'lucide-react'
import { useCallback, useState } from 'react'

import type {RouteConfig} from '../routes';
import { routes } from '../routes'

interface SidebarProps {
  currentPath?: string
  onNavigate?: (path: string) => void
}

interface NavigationItem {
  path: string
  title: string
  children?: NavigationItem[]
}

// 构建嵌套的导航树结构
function buildNavigationTree(routes: RouteConfig[]): NavigationItem[] {
  const tree: NavigationItem[] = []
  const pathMap = new Map<string, NavigationItem>()

  // 先创建所有节点
  routes.forEach((route) => {
    const item: NavigationItem = {
      path: route.path,
      title: route.title,
      children: [],
    }
    pathMap.set(route.path, item)
  })

  // 构建树结构
  routes.forEach((route) => {
    const item = pathMap.get(route.path)!
    const pathParts = route.path.split('/').filter(Boolean)

    if (pathParts.length === 0) {
      // 根路径
      tree.push(item)
    } else if (pathParts.length === 1) {
      // 一级路径
      tree.push(item)
    } else {
      // 多级路径，找到父级
      const parentPath = `/${  pathParts.slice(0, -1).join('/')}`
      const parent = pathMap.get(parentPath)
      if (parent) {
        parent.children!.push(item)
      } else {
        // 如果没有找到父级，作为顶级项添加
        tree.push(item)
      }
    }
  })

  return tree
}

interface NavigationItemProps {
  item: NavigationItem
  currentPath?: string
  onNavigate?: (path: string) => void
  level?: number
}

function NavigationItemComponent({
  item,
  currentPath,
  onNavigate,
  level = 0,
}: NavigationItemProps) {
  // 检查是否应该展开：当前路径是该项目的子路径，或者当前路径就是该项目且有子项目
  const shouldExpand = useCallback(() => {
    if (!currentPath) return false

    // 如果当前路径以该项目路径开头且不完全相等，说明是子路径
    if (currentPath.startsWith(item.path) && currentPath !== item.path) {
      // 确保是真正的子路径（避免 /api 匹配 /api-docs 这种情况）
      const remainingPath = currentPath.slice(item.path.length)
      return remainingPath.startsWith('/')
    }

    // 如果当前路径就是该项目路径，且有子项目，也展开
    if (
      currentPath === item.path &&
      item.children &&
      item.children.length > 0
    ) {
      return true
    }

    return false
  }, [currentPath, item.path, item.children])

  const [isExpanded, setIsExpanded] = useState(shouldExpand)
  const isActive = currentPath === item.path
  const hasChildren = item.children && item.children.length > 0

  const handleTitleClick = () => {
    onNavigate?.(item.path)
  }

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="w-full">
      <div
        className={`
          flex w-full cursor-pointer
          items-center transition-all duration-200 ease-in-out select-none
          ${
            isActive
              ? 'bg-blue-400/20 font-medium'
              : 'text-gray-500 hover:text-gray-900'
          }
          ${level > 0 ? 'pl-3' : ''}
        `}
      >
        <button
          onClick={handleTitleClick}
          className="flex-1 truncate px-3 py-3 text-left text-base lg:py-2.5 lg:text-sm"
        >
          {item.title}
        </button>
        {hasChildren && (
          <button
            onClick={handleArrowClick}
            className="hover:bg-opacity-20 mr-1 rounded-md p-3 transition-all duration-200 hover:bg-gray-400/10 lg:p-2"
          >
            <ChevronRight
              className={`h-5 w-5 transition-transform duration-200 lg:h-4 lg:w-4 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavigationItemComponent
              key={child.path}
              item={child}
              currentPath={currentPath}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const navigationTree = buildNavigationTree(routes)

  return (
    <aside className="lg:border-separator-opaque relative h-screen w-64 overflow-x-hidden overflow-y-auto border-r border-gray-200 bg-white/80 backdrop-blur-2xl">
      <div className="w-full">
        <div className="lg:border-separator-opaque flex items-center border-b border-gray-200 px-4 py-6">
          <img
            src="https://github.com/Afilmory/assets/blob/main/512-mac.png?raw=true"
            alt="Afilmory"
            className="h-14 w-14 rounded-t-lg"
          />
          <div className="ml-3 flex-1">
            <h2 className="text-xl font-semibold text-black">Afilmory</h2>
            <p className="text-text-tertiary text-sm">Documentation</p>
          </div>
        </div>

        <nav className="space-y-1 pb-6">
          {navigationTree.map((item) => (
            <NavigationItemComponent
              key={item.path}
              item={item}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>
    </aside>
  )
}
