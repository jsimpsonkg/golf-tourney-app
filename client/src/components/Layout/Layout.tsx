import { Link, Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-10 border-b border-fairway-900/10 bg-fairway-700 text-white shadow-sm">
        <nav className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="text-lg">⛳</span>
            Tournament Tracker
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
