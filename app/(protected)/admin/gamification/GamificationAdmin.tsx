'use client'

import { useState } from 'react'
import { Trophy, Medal, Sparkles, Zap, UsersRound, Flame } from 'lucide-react'

interface Badge {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  condition_type: string
  condition_value: number
  xp_reward: number
  is_active: boolean
  earned_count: number
}

interface LeaderUser {
  id: string
  full_name: string
  xp_points: number
  level: number
  streak_days: number
  shop_name: string | null
  badge_count: number
}

interface Props {
  badges: Record<string, unknown>[]
  leaderboard: Record<string, unknown>[]
}

const CONDITION_LABELS: Record<string, string> = {
  xp_milestone: 'XP chegarasi',
  course_count: 'Kurs soni',
  streak_days: 'Ketma-ket kunlar',
  completion_rate: 'Yakunlash foizi',
}

export function GamificationAdmin({ badges: rawBadges, leaderboard: rawLb }: Props) {
  const badges = rawBadges as unknown as Badge[]
  const leaderboard = rawLb as unknown as LeaderUser[]
  const [tab, setTab] = useState<'badges' | 'leaderboard'>('badges')

  const activeBadges = badges.filter((b) => b.is_active)
  const totalXP = leaderboard.reduce((s, u) => s + (u.xp_points ?? 0), 0)
  const avgXP = leaderboard.length > 0 ? Math.round(totalXP / leaderboard.length) : 0

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jami nishonlar', value: badges.length, icon: Medal, color: '#7c3aed' },
          { label: 'Faol nishonlar', value: activeBadges.length, icon: Sparkles, color: '#0B3D91' },
          { label: 'O\'rtacha XP', value: avgXP, icon: Zap, color: '#FFB81C' },
          { label: 'Top 20 o\'yinchi', value: leaderboard.length, icon: UsersRound, color: '#0f766e' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}>
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['badges', 'leaderboard'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[#0B3D91] text-[#0B3D91]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'badges' ? (
            <span className="flex items-center gap-1.5"><Medal className="h-3.5 w-3.5" /> Nishonlar</span>
          ) : (
            <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Reyting</span>
          )}
          </button>
        ))}
      </div>

      {/* Badges tab */}
      {tab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3 ${!badge.is_active ? 'opacity-50' : ''}`}
              style={{ borderColor: (badge.color ?? '#e5e7eb') + '44' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: (badge.color ?? '#6366f1') + '20' }}
              >
                {badge.icon ?? <Medal className="h-6 w-6" style={{ color: badge.color ?? '#6366f1' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{badge.name}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{ backgroundColor: (badge.color ?? '#6366f1') + '15', color: badge.color ?? '#6366f1' }}
                  >
                    +{badge.xp_reward} XP
                  </span>
                </div>
                {badge.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{badge.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500">
                    {CONDITION_LABELS[badge.condition_type] ?? badge.condition_type}: <strong>{badge.condition_value}</strong>
                  </span>
                  <span className="text-xs text-gray-400">· {badge.earned_count} xodim oldi</span>
                </div>
              </div>
            </div>
          ))}
          {badges.length === 0 && (
            <div className="col-span-3 py-16 text-center">
              <Medal className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Nishonlar yo&apos;q</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard tab */}
      {tab === 'leaderboard' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">O&apos;rin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Xodim</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Daraja</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">XP ball</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Streak</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Nishonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaderboard.map((u, i) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${i < 3 ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    {i === 0 ? (
                      <Trophy className="h-5 w-5 mx-auto" style={{ color: '#FFB81C' }} />
                    ) : i === 1 ? (
                      <Medal className="h-5 w-5 mx-auto" style={{ color: '#C0C0C0' }} />
                    ) : i === 2 ? (
                      <Medal className="h-5 w-5 mx-auto" style={{ color: '#CD7F32' }} />
                    ) : (
                      <span className="text-xs font-medium text-gray-500">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: '#0B3D91' }}>
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{u.full_name}</p>
                        {u.shop_name && <p className="text-xs text-gray-400">{String(u.shop_name)}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                      <Sparkles className="h-3 w-3" />Lv.{u.level ?? 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-amber-600">{(u.xp_points ?? 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">XP</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">
                    {u.streak_days > 0 ? (
                      <span className="flex items-center justify-center gap-1 text-orange-500">
                        <Flame className="h-3.5 w-3.5" /> {u.streak_days} kun
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                      <Trophy className="h-3 w-3 text-amber-400" />
                      {u.badge_count}
                    </span>
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">Ma&apos;lumot yo&apos;q</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
