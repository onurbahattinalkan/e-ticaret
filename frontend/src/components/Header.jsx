import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export default function Header() {
  const items = useCartStore((s) => s.items)
  const openCart = useCartStore((s) => s.openCart)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="bg-orange-500 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight whitespace-nowrap select-none"
        >
          🛍️ DopaminShop
        </Link>

        {/* Sahte arama çubuğu */}
        <div className="flex-1 mx-2 hidden sm:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Ürün, kategori veya marka ara..."
              className="w-full pl-4 pr-12 py-2 rounded-md text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              readOnly
            />
            <button
              className="absolute right-0 top-0 h-full px-3 bg-orange-300 hover:bg-orange-200 rounded-r-md text-orange-700 transition-colors"
              tabIndex={-1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sepet butonu */}
        <button
          onClick={openCart}
          className="relative flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-md font-semibold hover:bg-orange-50 active:bg-orange-100 transition-colors whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm">Sepet</span>
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
