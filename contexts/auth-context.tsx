'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@/lib/auth'

interface AuthContextType {
  user: Session | null
  setUser: (user: Session | null) => void
  updateUser: (partial: Partial<Session>) => void
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser: Session | null
}) {
  const router = useRouter()
  const [user, setUser] = useState<Session | null>(initialUser)

  const updateUser = useCallback((partial: Partial<Session>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev))
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    setUser(null)
    router.push('/login')
    router.refresh()
  }, [router])

  return (
    <AuthContext.Provider
      value={{ user, setUser, updateUser, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
