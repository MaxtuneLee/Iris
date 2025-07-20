import { useState } from 'react'

import { DocumentMeta } from './components/DocumentMeta'
import { Sidebar } from './components/Sidebar'
import routes from './routes'

function App({ url }: { url?: string }) {
  const [currentPath, setCurrentPath] = useState(url || '/')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const matchedRoute = routes.find((route) => route.path === currentPath)

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
    setIsSidebarOpen(false) // 导航后关闭侧边栏
    // 在实际应用中，这里会更新浏览器历史记录
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  if (!matchedRoute) {
    return (
      <div className="bg-background flex h-screen">
        {/* 桌面端侧边栏 */}
        <div className="hidden lg:block">
          <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
        </div>

        {/* 移动端侧边栏 */}
        {isSidebarOpen && (
          <>
            <div
              className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="fixed top-0 left-0 z-50 h-full lg:hidden">
              <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
            </div>
          </>
        )}

        <main className="bg-fill-primary flex flex-1 items-center justify-center">
          {/* 移动端顶部栏 */}
          <div className="bg-fill-primary fixed top-0 right-0 left-0 z-30 h-16 border-b border-gray-200 lg:hidden">
            <div className="flex h-full items-center px-4">
              <button
                onClick={toggleSidebar}
                className="text-text-primary hover:bg-fill-secondary rounded-lg p-2 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div className="flex-1 text-center">
                <h1 className="text-text-primary text-lg font-semibold">
                  Afilmory Docs
                </h1>
              </div>
              <div className="w-10" /> {/* 平衡按钮 */}
            </div>
          </div>

          <div className="bg-fill-secondary border-separator-opaque mx-4 mt-16 rounded-xl border p-8 text-center shadow-sm lg:mt-0">
            <h1 className="text-text-primary mb-3 text-3xl font-semibold">
              404
            </h1>
            <p className="text-text-secondary text-lg">Page not found</p>
            <button
              onClick={() => handleNavigate('/')}
              className="bg-accent mt-6 rounded-lg px-4 py-2 text-white transition-opacity hover:opacity-90"
            >
              Return Home
            </button>
          </div>
        </main>
      </div>
    )
  }

  const Component = matchedRoute.component
  const meta = matchedRoute.meta as {
    createdAt?: string
    lastModified?: string
  }

  return (
    <div className="bg-background flex h-screen">
      {/* 桌面端侧边栏 */}
      <div className="hidden lg:block">
        <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
      </div>

      <>
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black/10 lg:hidden"
          style={{ display: isSidebarOpen ? 'block' : 'none' }}
          onClick={() => setIsSidebarOpen(false)}
        />
        <div
          className="fixed top-0 left-0 z-50 h-full lg:hidden"
          style={{
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
        </div>
      </>

      <main className="bg-fill-primary relative flex-1 overflow-y-auto">
        <div className="bg-fill-primary sticky top-0 z-30 h-16 border-b border-gray-200 bg-white/80 backdrop-blur-3xl lg:hidden">
          <div className="flex h-full items-center px-4">
            <button
              onClick={toggleSidebar}
              className="text-text-primary hover:bg-fill-secondary rounded-lg p-2 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <a href="/" className="select-none">
                <h1 className="text-text-primary text-lg font-semibold">
                  Afilmory Docs
                </h1>
              </a>
            </div>
            <div className="w-10" /> {/* 平衡按钮 */}
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-12">
          <article className="prose prose-lg bg-fill-primary max-w-none rounded-xl p-4 lg:p-8">
            <Component />
            <DocumentMeta
              createdAt={meta.createdAt}
              lastModified={meta.lastModified}
            />
          </article>
        </div>
      </main>
    </div>
  )
}

export default App
