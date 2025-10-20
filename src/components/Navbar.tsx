import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { pathname } = useLocation();
  const linkCls = (path: string) =>
    `relative px-3 py-2 rounded-sm no-underline ${
      pathname === path ? 'text-button' : 'text-text'
    } hover:!text-white hover:scale-105 transition duration-200`;

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-white/10">
      <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Website name on the far left */}
        <div className="font-bold text-button mr-12">Mehflix</div>

        {/* Centered navigation links */}
        <nav className="flex gap-6 justify-center flex-1">
          <Link to="/home" className={linkCls('/home')}>
            Home
            {pathname === '/home' && (
              <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-button rounded-full" />
            )}
          </Link>
          <Link to="/categories" className={linkCls('/categories')}>
            Categories
            {pathname === '/categories' && (
              <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-button rounded-full" />
            )}
          </Link>
        </nav>

        {/* Profile and notifications on the far right */}
        <div className="ml-4 flex items-center gap-3">
          <NotificationCenter />
          <Link
            to="/profile"
            className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-500 transition-colors duration-200"
          >
          </Link>
        </div>
      </div>
    </header>
  );
}
