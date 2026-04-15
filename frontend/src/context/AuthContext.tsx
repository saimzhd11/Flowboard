'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import type { AuthUser, User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('token')
      if (!token) { setLoading(false); return }
      try {
        const { data } = await api.get<User>('/auth/me')
        setUser(data)
        connectSocket()
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [])

  const persist = (data: AuthUser) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email }))
    setUser({ _id: data._id, name: data.name, email: data.email })
    connectSocket()
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthUser>('/auth/login', { email, password })
    persist(data)
    router.push('/dashboard')
  }

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post<AuthUser>('/auth/register', { name, email, password })
    persist(data)
    router.push('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    disconnectSocket()
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
