import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()
  const linkCls = (path: string) => `relative px-3 py-2 rounded-sm no-underline ${pathname === path ? 'text-button' : 'text-text'} hover:text-[#e7d6ef]'`

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-white/10">
      <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-button">Mehflix</div>
        <nav className="hidden md:flex gap-2">
          <Link to="/" className={linkCls('/')}>Home{pathname === '/' && <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-button rounded-full" />}</Link>
          <Link to="/categories" className={linkCls('/categories')}>Categories{pathname === '/categories' && <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-button rounded-full" />}</Link>
          <Link to="/search" className={linkCls('/search')}>Search{pathname === '/search' && <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-button rounded-full" />}</Link>
        </nav>
        <div className="md:hidden text-text">☰</div>
      </div>
    </header>
  )
}


