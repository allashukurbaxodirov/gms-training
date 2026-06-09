'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/lib/formatters'
import { ADMIN_ROLES, TRAINER_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { BellDot, Search, ChevronDown, Sparkles, CircleUser, Medal, LayoutGrid, LogOut } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [unreadCount, setUnreadCount]   = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?count=true')
      if (res.ok) {
        const d = await res.json()
        setUnreadCount(d.count ?? 0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchUnread()
    const t = setInterval(fetchUnread, 30_000)
    return () => clearInterval(t)
  }, [fetchUnread])

  if (!user) return null

  const role      = user.role as Role
  const isAdmin   = ADMIN_ROLES.includes(role)
  const isTrainer = TRAINER_ROLES.includes(role)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center gap-4 px-4 lg:px-6"
      style={{
        backgroundColor: '#0B3D91',
        boxShadow: '0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo — shows only on mobile (desktop: sidebar logo) */}
      <div className="flex items-center gap-2 shrink-0 lg:hidden">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <span className="text-xs font-bold" style={{ color: '#FFB81C' }}>G</span>
        </div>
        <span className="text-white font-bold text-sm">GMS Training</span>
      </div>

      {/* Spacer on desktop (sidebar takes 224px) */}
      <div className="hidden lg:block w-0" />

      {/* Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.45)' }} />
          <input
            type="text"
            placeholder="Kurs, xodim, qidirish..."
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-white placeholder:text-white/40 border-0 outline-none focus:ring-2 focus:ring-white/20"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Role switcher */}
        <div
          className="hidden sm:flex items-center gap-0.5 rounded-lg overflow-hidden p-0.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="px-3 py-1 text-xs font-semibold rounded-md transition-all"
            style={
              !isAdmin
                ? { backgroundColor: '#ffffff', color: '#0B3D91' }
                : { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)' }
            }
          >
            Xodim
          </button>
          {(isTrainer || isAdmin) && (
            <button
              onClick={() => router.push('/brigade/jits')}
              className="px-3 py-1 text-xs font-semibold rounded-md transition-all"
              style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)' }}
            >
              O&apos;qituvchi
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="px-3 py-1 text-xs font-semibold rounded-md transition-all"
              style={
                isAdmin
                  ? { backgroundColor: '#ffffff', color: '#0B3D91' }
                  : { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)' }
              }
            >
              Admin
            </button>
          )}
        </div>

        {/* Bell */}
        <button
          onClick={() => router.push('/notifications')}
          className="navbar-icon-btn relative w-9 h-9 flex items-center justify-center rounded-xl transition-all"
        >
          <BellDot className="h-4 w-4 text-white" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* XP badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: 'rgba(255,184,28,0.2)', color: '#FFB81C' }}
        >
          <Sparkles className="h-3.5 w-3.5" /> {user.xp_points ?? 0} XP · Lv.{user.level ?? 1}
        </div>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="navbar-user-btn flex items-center gap-2 rounded-xl px-2 py-1 transition-all"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: '#FFB81C', color: '#0B3D91' }}
            >
              {initials(user.full_name)}
            </div>
            <span className="hidden sm:block text-white text-sm font-medium max-w-24 truncate">
              {user.full_name.split(' ')[0]}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-white/60 hidden sm:block" />
          </button>

          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div
                className="absolute right-0 top-11 w-52 rounded-xl overflow-hidden z-50"
                style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e5e7eb' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <p className="font-semibold text-sm text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user.tab_number} · Lv.{user.level ?? 1}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <CircleUser className="h-4 w-4 text-gray-400" />
                    Mening profilim
                  </Link>
                  <Link
                    href="/my-certificates"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Medal className="h-4 w-4 text-amber-400" />
                    Sertifikatlar
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutGrid className="h-4 w-4 text-[#0B3D91]" />
                      Boshqaruv paneli
                    </Link>
                  )}
                </div>
                <div style={{ borderTop: '1px solid #f3f4f6' }} className="py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); logout() }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Chiqish
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
