import { useState, useEffect } from 'react'
import Header from '../components/Header'
import ProductCard from '../components/ProductCard'
import { api } from '../services/api'
import { useCartStore } from '../store/cartStore'

const CATEGORIES = ['Tümü', 'Elektronik', 'Giyim', 'Spor', 'Aksesuar', 'Ev & Yaşam', 'Kitap']

/** Yükleme sırasında iskelet kart */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/3 mt-2" />
        <div className="h-10 bg-gray-200 rounded-lg mt-3" />
      </div>
    </div>
  )
}

export default function CatalogPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Tümü')
  const fetchCart = useCartStore((s) => s.fetchCart)

  // Sayfa yüklendiğinde sepeti senkronize et
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  useEffect(() => {
    setLoading(true)
    const category = activeCategory === 'Tümü' ? null : activeCategory
    api
      .getProducts(category)
      .then(setProducts)
      .catch((e) => console.error('Ürünler yüklenemedi:', e.message))
      .finally(() => setLoading(false))
  }, [activeCategory])

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="max-w-xl">
            <p className="text-orange-100 text-xs font-semibold uppercase tracking-widest mb-1">
              🧠 Dijital Sağlık Platformu
            </p>
            <h1 className="text-3xl font-extrabold leading-tight mb-2">
              Alışveriş Heyecanı,<br />Sıfır Masraf
            </h1>
            <p className="text-orange-100 text-sm">
              Satın alma döngüsünü gerçek para harcamadan simüle et.
              Dopamin tatminini finansal zarar görmeden yaşa.
            </p>
          </div>
        </div>
      </div>

      {/* Kategori sekmeleri */}
      <div className="bg-white border-b sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ürün ızgarası */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg font-semibold text-gray-500">
              Bu kategoride ürün bulunamadı.
            </p>
            <button
              onClick={() => setActiveCategory('Tümü')}
              className="mt-4 text-orange-500 hover:underline text-sm font-medium"
            >
              Tüm ürünlere bak →
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4 font-medium">
              {activeCategory === 'Tümü' ? 'Tüm Ürünler' : activeCategory} —{' '}
              {products.length} ürün
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Alt bilgi */}
      <footer className="text-center py-8 text-xs text-gray-400 border-t bg-white mt-8">
        <p>DopaminShop © 2026 — Gerçek para işlemi gerçekleşmez. Tüm siparişler simülasyondur. 🧠</p>
      </footer>
    </div>
  )
}
