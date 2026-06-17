/**
 * Kimlik doğrulama context'i.
 *
 * - JWT token'ı localStorage'da saklar.
 * - Sayfa yenilendiğinde /api/auth/me ile kullanıcıyı doğrular.
 * - login, register, logout fonksiyonları sağlar.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Sayfa yüklendiğinde mevcut token ile kullanıcıyı doğrula
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .getMe(token)
      .then((u) => setUser(u))
      .catch(() => {
        // Token geçersiz — temizle
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (email, password) => {
    const data = await authApi.register(email, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
