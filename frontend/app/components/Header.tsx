'use client';

import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useCart } from '@/app/context/CartContext';

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm tracking-tight">PF</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">PF Commerce</span>
          </Link>

          {/* Centre navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
            >
              Categories
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right — cart + auth */}
          <div className="flex items-center gap-2">
            {/* Cart icon */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={`Shopping cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-0.5">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Auth section */}
            <div className="hidden sm:flex items-center gap-2 ml-1 min-w-[9rem] justify-end">
              {loading ? (
                // Skeleton prevents layout shift during hydration
                <div className="h-8 w-36 bg-gray-100 rounded-lg animate-pulse" />
              ) : user ? (
                <>
                  <span className="text-sm font-medium text-gray-700 px-2 truncate max-w-[8rem]">
                    Hi, {user.name.split(' ')[0]}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
