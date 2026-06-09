import { getSession } from '@/lib/auth'
import { getMyCourses } from '@/lib/queries/courses'
import { ROLE_LABELS, ADMIN_ROLES, TRAINER_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { BookmarkCheck, PlayCircle, Sparkles, Medal, ArrowRight, Play, BookOpen, Trophy, Flame, CheckCircle2, Zap, GraduationCap, UserPlus, Library, Table2, ShieldCheck, Star } from 'lucide-react'
import Link from 'next/link'
import sql from '@/lib/db'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  let courses: Record<string, unknown>[] = []
  let badgeCount = 0
  try {
    courses = (await getMyCourses(session.id)) as Record<string, unknown>[]
    const [bc] = await sql`SELECT COUNT(*)::int AS cnt FROM user_badges WHERE user_id = ${session.id}`
    badgeCount = bc?.cnt ?? 0
  } catch {}

  const role      = session.role as Role
  const roleLabel = ROLE_LABELS[role] ?? 'Foydalanuvchi'
  const isAdmin   = ADMIN_ROLES.includes(role)
  const isTrainer = TRAINER_ROLES.includes(role)

  const inProgress = courses.filter((c) => c.status === 'in_progress')
  const completed  = courses.filter((c) => c.status === 'completed')
  const assigned   = courses.filter((c) => c.status === 'assigned')

  const xp      = session.xp_points ?? 0
  const level   = session.level ?? 1
  const streak  = session.streak_days ?? 0
  const xpNext  = level * 200
  const xpPct   = Math.min(100, Math.round((xp % xpNext) / xpNext * 100))

  const firstName = session.full_name.split(' ')[0]

  return (
    <div className="space-y-5">

      {/* ── HERO CARD ── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6d28d9 0%, #1e40af 55%, #0B3D91 100%)',
          boxShadow: '0 8px 32px rgba(11,61,145,0.35)',
        }}
      >
        {/* Background circles */}
        <div
          className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }}
        />
        <div
          className="absolute right-16 bottom-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FFB81C 0%, transparent 70%)' }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">
                Xush kelibsiz, {firstName}! 👋
              </h1>
            </div>
            <p className="text-blue-200 text-sm mb-4">
              Bugun yangi narsa o&apos;rganing va o&apos;sishda davom eting
            </p>

            {/* Level progress */}
            <div className="max-w-xs">
              <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5">
                <span>Level {level} → {level + 1}</span>
                <span>{xp} XP</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #FFB81C, #f97316)' }}
                />
              </div>
            </div>
          </div>

          {/* Streak badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
            style={{ backgroundColor: 'rgba(255,184,28,0.2)', border: '1px solid rgba(255,184,28,0.35)' }}
          >
            <Flame className="h-4 w-4" style={{ color: '#FFB81C' }} />
            <span className="text-sm font-bold text-white">{streak} kun</span>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: BookmarkCheck,
            label: 'Tayinlangan',
            value: assigned.length,
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            bg: 'rgba(245,158,11,0.1)',
            iconColor: '#f59e0b',
          },
          {
            icon: PlayCircle,
            label: 'Jarayonda',
            value: inProgress.length,
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            bg: 'rgba(59,130,246,0.1)',
            iconColor: '#3b82f6',
          },
          {
            icon: Sparkles,
            label: 'XP ball',
            value: xp,
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            bg: 'rgba(139,92,246,0.1)',
            iconColor: '#8b5cf6',
          },
          {
            icon: Medal,
            label: 'Nishonlar',
            value: badgeCount,
            gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            bg: 'rgba(249,115,22,0.1)',
            iconColor: '#f97316',
          },
        ].map(({ icon: Icon, label, value, bg, iconColor }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{
              background: bg,
              border: '1px solid rgba(255,255,255,0.7)',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: iconColor + '18' }}
            >
              <Icon className="h-6 w-6" style={{ color: iconColor }} />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT: courses + sidebar ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Left: Courses */}
        <div className="lg:col-span-2 space-y-4">
          {/* In-progress courses */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-blue-400" />
                <h3 className="font-semibold text-gray-900">Davom etayotgan kurslar</h3>
              </div>
              <Link
                href="/my-courses"
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: '#0B3D91' }}
              >
                Barchasi <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {inProgress.length === 0 ? (
              <div className="py-14 flex flex-col items-center text-center px-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: '#f3f4f6' }}
                >
                  <BookOpen className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium text-sm">Hali boshlangan kurs yo&apos;q</p>
                <p className="text-gray-300 text-xs mt-1">O&apos;quv rejangizdan kurs tanlang</p>
                <Link
                  href="/learning-paths"
                  className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#0B3D91' }}
                >
                  Kurslar ko&apos;rish
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {inProgress.slice(0, 5).map((c) => (
                  <div key={c.id as string} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#eff6ff' }}
                    >
                      <Play className="h-4 w-4" style={{ color: '#0B3D91' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{c.title as string}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${c.progress_percent ?? 0}%`,
                              background: 'linear-gradient(90deg, #3b82f6, #0B3D91)',
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{String(c.progress_percent ?? 0)}%</span>
                      </div>
                    </div>
                    <Link
                      href={`/my-courses/${c.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shrink-0"
                      style={{ backgroundColor: '#0B3D91' }}
                    >
                      Davom
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned courses */}
          {assigned.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="h-4 w-4 text-amber-400" />
                  <h3 className="font-semibold text-gray-900">Tayinlangan kurslar</h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#fef3c7', color: '#d97706' }}
                  >
                    {assigned.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {assigned.slice(0, 3).map((c) => (
                  <div key={c.id as string} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#fffbeb' }}
                    >
                      <BookOpen className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{c.title as string}</p>
                      <p className="text-xs text-gray-400 capitalize">{c.difficulty as string} · tayinlangan</p>
                    </div>
                    <Link
                      href={`/my-courses/${c.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fed7aa' }}
                    >
                      Boshlash
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role info banner */}
          <div
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: isAdmin
                ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                : isTrainer
                ? 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
                : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: `1px solid ${isAdmin ? '#bfdbfe' : isTrainer ? '#ddd6fe' : '#bbf7d0'}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: isAdmin ? '#dbeafe' : isTrainer ? '#ede9fe' : '#dcfce7',
              }}
            >
              {isAdmin
                ? <ShieldCheck className="h-5 w-5" style={{ color: '#1d4ed8' }} />
                : isTrainer
                ? <GraduationCap className="h-5 w-5" style={{ color: '#7c3aed' }} />
                : <Star className="h-5 w-5" style={{ color: '#16a34a' }} />
              }
            </div>
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: isAdmin ? '#1d4ed8' : isTrainer ? '#7c3aed' : '#16a34a' }}
              >
                {roleLabel} sifatida
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                {(isAdmin
                  ? ['Foydalanuvchilarni boshqarish', 'Kurslar yaratish', 'Analitika ko\'rish', 'Hisobotlar']
                  : isTrainer
                  ? ['Kursga yozilish', 'Brigade JIT boshqarish', 'Sertifikat olish', 'Live darsda qatnashish']
                  : ['Kursga yozilish', 'Dars ko\'rish & test', 'Sertifikat olish', 'Live darsda qatnashish']
                ).map((item) => (
                  <span key={item} className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Streak card */}
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: streak > 0
                ? 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)'
                : '#ffffff',
              border: streak > 0 ? '1px solid #fed7aa' : '1px solid #e5e7eb',
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex justify-center mb-2">
              {streak > 0
                ? <Flame className="h-10 w-10 text-orange-500" />
                : <Sparkles className="h-10 w-10 text-gray-300" />
              }
            </div>
            <p
              className="font-bold text-base"
              style={{ color: streak > 0 ? '#d97706' : '#374151' }}
            >
              {streak > 0 ? `${streak} kunlik ketma-ketlik!` : 'Hali streak yo\'q'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {streak > 0
                ? 'Har kuni kiring va streak saqlang'
                : 'Har kuni kiring va streak boshlang'}
            </p>
          </div>

          {/* Quick stats */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Medal className="h-4 w-4 text-amber-400" />
                Mening natijalarim
              </h3>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { label: 'Tugatilgan kurslar', value: completed.length, Icon: CheckCircle2, color: '#10b981' },
                { label: 'Sertifikatlar',      value: completed.length, Icon: Trophy,       color: '#f59e0b' },
                { label: 'XP ball',            value: xp,               Icon: Zap,          color: '#8b5cf6' },
                { label: 'Daraja',             value: `Lv. ${level}`,   Icon: Star,         color: '#f59e0b' },
              ].map(({ label, value, Icon, color }) => (
                <div key={label} className="flex items-center justify-between py-0.5">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </span>
                    {label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* So'nggi nishonlar */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                So&apos;nggi nishonlar
              </h3>
            </div>
            {badgeCount === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
                  <Medal className="h-6 w-6 text-amber-300" />
                </div>
                <p className="text-xs text-gray-400">Kurslarni tugatib nishon yig&apos;ing!</p>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-2xl font-bold text-gray-900">{badgeCount}</p>
                <p className="text-xs text-gray-400">ta nishon qozonildi</p>
              </div>
            )}
          </div>

          {/* Quick links */}
          {isAdmin && (
            <div
              className="rounded-2xl p-4 space-y-2"
              style={{ backgroundColor: '#0B3D91' }}
            >
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Tezkor amallar</p>
              {[
                { href: '/admin/users',           label: 'Xodim qo\'shish', Icon: UserPlus },
                { href: '/admin/courses',          label: 'Kurs yaratish',   Icon: Library  },
                { href: '/admin/training-matrix',  label: 'Matritsa',        Icon: Table2   },
              ].map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all hover:bg-white/20"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                  {label}
                  <ArrowRight className="h-3 w-3 ml-auto opacity-60" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
