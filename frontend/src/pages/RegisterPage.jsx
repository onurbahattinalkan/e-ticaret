/**
 * Kayit sayfasi — yeni kullanici olusturur ve otomatik giris yapar.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('Sifreler eslesmiyor')
      return
    }

    setLoading(true)
    try {
      await register(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Kayit basarisiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Baslik */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-orange-600">DopaminShop</h1>
          <p className="text-gray-500 mt-2">Yeni hesap olusturun</p>
        </div>

        {/* Hata mesaji */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* E-posta */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              placeholder="ornek@email.com"
            />
          </div>

          {/* Sifre */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Sifre
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              placeholder="En az 6 karakter"
            />
          </div>

          {/* Sifre tekrar */}
          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
              Sifre (Tekrar)
            </label>
            <input
              id="passwordConfirm"
              type="password"
              required
              minLength={6}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              placeholder="Sifrenizi tekrar girin"
            />
          </div>

          {/* Kayit butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Kayit yapiliyor...' : 'Kayit Ol'}
          </button>
        </form>

        {/* Giris linki */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Zaten hesabiniz var mi?{' '}
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">
            Giris Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
