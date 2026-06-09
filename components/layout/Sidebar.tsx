'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/lib/formatters'
import { ADMIN_ROLES, TRAINER_ROLES, ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import {
  Gauge, GraduationCap, Route, Radio, Lightbulb, BadgeCheck,
  Medal, Trophy, MessageSquare, CircleUser,
  UsersRound, Library, BarChart2, Table2, GitFork,
  Swords, Clapperboard, ListChecks, FileSpreadsheet, LayoutGrid,
  LogOut, Rocket,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const NAV_ASOSIY: NavItem[] = [
  { href: '/dashboard',      label: 'Dashboard',        icon: Gauge },
  { href: '/my-courses',     label: 'Mening kurslarim', icon: GraduationCap },
  { href: '/learning-paths', label: 'O\'quv rejasi',    icon: Route },
  { href: '/live-sessions',  label: 'Jonli sessiyalar', icon: Radio },
  { href: '/my-jits',        label: 'JIT amaliyoti',    icon: Lightbulb },
  { href: '/briefing',       label: 'Yo\'riqnoma',      icon: BadgeCheck },
]

const NAV_TRAINER: NavItem[] = [
  { href: '/brigade/jits',   label: 'Brigada JIT',      icon: UsersRound },
]

const NAV_PERSONAL: NavItem[] = [
  { href: '/my-certificates',label: 'Sertifikatlarim',  icon: Medal },
  { href: '/leaderboard',    label: 'Reyting',          icon: Trophy },
  { href: '/surveys',        label: 'So\'rovnomalar',   icon: MessageSquare },
  { href: '/profile',        label: 'Mening profilim',  icon: CircleUser },
]

const NAV_ADMIN: NavItem[] = [
  { href: '/admin',                  label: 'Admin panel',        icon: LayoutGrid },
  { href: '/admin/users',            label: 'Xodimlar',           icon: UsersRound },
  { href: '/admin/courses',          label: 'Kurslar',            icon: Library },
  { href: '/admin/analytics',        label: 'Analitika',          icon: BarChart2 },
  { href: '/admin/training-matrix',  label: 'Trening matritsa',   icon: Table2 },
  { href: '/admin/flexibility-chart',label: 'Moslashuvchanlik',   icon: GitFork },
  { href: '/admin/gamification',     label: 'Geymifikatsiya',     icon: Swords },
  { href: '/admin/live-sessions',    label: 'Sessiyalar',         icon: Clapperboard },
  { href: '/admin/learning-paths',   label: 'O\'quv rejasi',      icon: Route },
  { href: '/admin/surveys',          label: 'So\'rovnomalar',     icon: ListChecks },
  { href: '/admin/reports',          label: 'Hisobotlar',         icon: FileSpreadsheet },
]

/* ── sidebar constants ── */
const SIDEBAR_BG      = '#111827'
const SIDEBAR_ACTIVE  = 'rgba(255,255,255,0.11)'
const SIDEBAR_BORDER  = 'rgba(255,255,255,0.08)'
const TEXT_MUTED      = 'rgba(255,255,255,0.40)'
const TEXT_NORMAL     = 'rgba(255,255,255,0.68)'
const TEXT_ACTIVE     = '#ffffff'
const GOLD            = '#FFB81C'
const NAVY            = '#0B3D91'

export function Sidebar() {
  const pathname = usePathname()
  const { user, role, logout } = useAuth()
  const userRole = role as Role | undefined

  if (!user) return null

  const isAdmin   = userRole ? ADMIN_ROLES.includes(userRole)   : false
  const isTrainer = userRole ? TRAINER_ROLES.includes(userRole) : false

  const xp    = user.xp_points ?? 0
  const level = user.level ?? 1
  const streak = user.streak_days ?? 0
  const xpForNext  = level * 200
  const xpProgress = Math.min(100, Math.round((xp % xpForNext) / xpForNext * 100))

  function NavLink({ item }: { item: NavItem }) {
    const isActive =
      pathname === item.href ||
      (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href))
    const Icon = item.icon

    return (
      <Link
        href={item.href}
        className="sidebar-nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group relative"
        style={{
          backgroundColor: isActive ? SIDEBAR_ACTIVE : 'transparent',
          color: isActive ? TEXT_ACTIVE : TEXT_NORMAL,
        }}
      >
        {/* Active accent line */}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
            style={{ backgroundColor: GOLD }}
          />
        )}

        {/* Icon wrapper — aktiv bo'lsa rangli fon */}
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
          style={{
            backgroundColor: isActive
              ? `${GOLD}22`
              : 'rgba(255,255,255,0.06)',
          }}
        >
          <Icon
            className="h-[15px] w-[15px]"
            style={{ color: isActive ? GOLD : 'rgba(255,255,255,0.5)' }}
          />
        </span>

        <span className="flex-1 truncate">{item.label}</span>
      </Link>
    )
  }

  function SectionLabel({ children }: { children: string }) {
    return (
      <p
        className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: TEXT_MUTED }}
      >
        {children}
      </p>
    )
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 w-56 flex flex-col hidden lg:flex"
      style={{
        backgroundColor: SIDEBAR_BG,
        borderRight: `1px solid ${SIDEBAR_BORDER}`,
      }}
    >
      {/* ── Logo ── */}
      <div
        className="h-14 flex items-center gap-2.5 px-4 shrink-0"
        style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: NAVY, boxShadow: '0 0 0 2px rgba(255,184,28,0.3)' }}
        >
          <Rocket className="h-4 w-4" style={{ color: GOLD }} />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">GMS Training</p>
          <p className="text-[10px] leading-tight" style={{ color: TEXT_MUTED }}>Learning Platform</p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <SectionLabel>Asosiy</SectionLabel>
        {NAV_ASOSIY.map((item) => <NavLink key={item.href} item={item} />)}

        {(isTrainer || isAdmin) && NAV_TRAINER.map((item) => <NavLink key={item.href} item={item} />)}

        <SectionLabel>Mening natijalarim</SectionLabel>
        {NAV_PERSONAL.map((item) => <NavLink key={item.href} item={item} />)}

        {isAdmin && (
          <>
            <SectionLabel>Boshqaruv</SectionLabel>
            {NAV_ADMIN.map((item) => <NavLink key={item.href} item={item} />)}
          </>
        )}
      </nav>

      {/* ── User section ── */}
      <div
        className="shrink-0 px-3 py-3"
        style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <div className="flex items-center gap-2.5 mb-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            {initials(user.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-semibold truncate leading-tight">{user.full_name}</p>
            <p className="text-[10px] truncate leading-tight" style={{ color: TEXT_MUTED }}>
              {ROLE_LABELS[userRole as Role] ?? 'Foydalanuvchi'}
            </p>
          </div>
          <button
            onClick={logout}
            className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Chiqish"
          >
            <LogOut className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>

        {/* Level + XP progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]" style={{ color: TEXT_MUTED }}>
            <span>Level {level} → {level + 1}</span>
            <span>{xp} XP</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${xpProgress}%`, backgroundColor: GOLD }}
            />
          </div>
          {streak > 0 && (
            <p className="text-[10px] text-center mt-1" style={{ color: GOLD }}>
              🔥 {streak} kunlik ketma-ketlik
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
