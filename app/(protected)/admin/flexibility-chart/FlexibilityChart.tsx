'use client'

import { useState, useMemo } from 'react'

interface Workstation {
  id: string
  code: string
  name: string
  subdivision_name: string | null
}

interface User {
  id: string
  full_name: string
  tab_number: string
  job_title: string | null
  shop_id: string | null
  shop_name: string | null
}

interface SkillEntry {
  user_id: string
  workstation_id: string
  level: string | null
  level_numeric: number | null
  can_backup: boolean
}

interface Props {
  skillMatrix: Record<string, unknown>[]
  workstations: Record<string, unknown>[]
  users: Record<string, unknown>[]
  shops: Record<string, unknown>[]
}

// Level color squares — classic flexibility chart style
const LEVEL_DISPLAY: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: '#ffffff', text: '#9ca3af', label: '—' },
  1: { bg: '#fee2e2', text: '#991b1b', label: '1' },   // beginner
  2: { bg: '#fef9c3', text: '#854d0e', label: '2' },   // learning
  3: { bg: '#d1fae5', text: '#065f46', label: '3' },   // competent
  4: { bg: '#0B3D91', text: '#ffffff', label: '4' },   // expert / can teach
}

export function FlexibilityChart({ skillMatrix: rawSm, workstations: rawW, users: rawU, shops: rawS }: Props) {
  const skillMatrix = rawSm as unknown as SkillEntry[]
  const workstations = rawW as unknown as Workstation[]
  const users = rawU as unknown as User[]
  const shops = rawS as unknown as { id: string; name: string }[]

  const [search, setSearch] = useState('')
  const [shopFilter, setShopFilter] = useState('')

  // Build lookup: userId → workstationId → SkillEntry
  const skillMap = useMemo(() => {
    const map = new Map<string, Map<string, SkillEntry>>()
    skillMatrix.forEach((s) => {
      if (!map.has(s.user_id)) map.set(s.user_id, new Map())
      map.get(s.user_id)!.set(s.workstation_id, s)
    })
    return map
  }, [skillMatrix])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (shopFilter && u.shop_id !== shopFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return u.full_name.toLowerCase().includes(q) || u.tab_number.toLowerCase().includes(q)
      }
      return true
    })
  }, [users, search, shopFilter])

  if (workstations.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-16 text-center text-gray-400">
        <p className="font-medium">Ish joylari (workstations) yo&apos;q</p>
        <p className="text-sm mt-1">Ma&apos;lumotlar bazasiga ish joylarini qo&apos;shing</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Xodim nomi yoki tabel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] flex-1 min-w-[200px]"
        />
        {shops.length > 0 && (
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none bg-white"
          >
            <option value="">Barcha sex/bo&apos;lim</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <span className="text-xs text-gray-400">{filteredUsers.length} xodim</span>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {Object.entries(LEVEL_DISPLAY).filter(([k]) => k !== '0').map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: v.bg, color: v.text }}>{v.label}</span>
              {k === '1' ? 'O\'rganmoqda' : k === '2' ? 'Biladi' : k === '3' ? 'Malakali' : 'O\'qita oladi'}
            </span>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <table className="border-collapse text-xs" style={{ minWidth: 'max-content' }}>
            <thead>
              {/* Header: sticky left cells + workstation columns */}
              <tr>
                <th className="border border-gray-200 font-semibold text-white text-center px-2 py-2" style={{ backgroundColor: '#0B3D91', position: 'sticky', left: 0, zIndex: 20, width: 36, minWidth: 36 }}>№</th>
                <th className="border border-gray-200 font-semibold text-white text-center px-2 py-2" style={{ backgroundColor: '#0B3D91', position: 'sticky', left: 36, zIndex: 20, width: 160, minWidth: 160 }}>F.I.Sh</th>
                <th className="border border-gray-200 font-semibold text-white text-center px-2 py-2" style={{ backgroundColor: '#0B3D91', position: 'sticky', left: 196, zIndex: 20, width: 70, minWidth: 70 }}>Tab №</th>
                {/* Workstation headers — rotated */}
                {workstations.map((w) => (
                  <th
                    key={w.id}
                    className="border border-gray-200 font-medium"
                    style={{
                      backgroundColor: '#1e3a8a',
                      color: '#dbeafe',
                      width: 36,
                      minWidth: 36,
                      height: 110,
                      padding: 0,
                      verticalAlign: 'bottom',
                    }}
                    title={w.name}
                  >
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '4px 3px', fontSize: 10, lineHeight: 1.2, maxHeight: 104, overflow: 'hidden' }}>
                      {w.code ? `${w.code} ` : ''}{w.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3 + workstations.length} className="py-16 text-center text-gray-400">
                    Xodimlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, rowIdx) => {
                  const userSkills = skillMap.get(user.id) ?? new Map()
                  const rowBg = rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc'
                  return (
                    <tr key={user.id} style={{ backgroundColor: rowBg }}>
                      <td className="border border-gray-200 text-center text-gray-400 font-medium" style={{ backgroundColor: rowBg, position: 'sticky', left: 0, zIndex: 10, padding: '4px 6px', width: 36 }}>
                        {rowIdx + 1}
                      </td>
                      <td className="border border-gray-200 font-medium text-gray-900" style={{ backgroundColor: rowBg, position: 'sticky', left: 36, zIndex: 10, padding: '4px 6px', width: 160, maxWidth: 160 }}>
                        <div className="truncate" style={{ fontSize: 11 }}>{user.full_name}</div>
                        {user.job_title && <div style={{ fontSize: 9, color: '#9ca3af' }} className="truncate">{user.job_title}</div>}
                      </td>
                      <td className="border border-gray-200 text-center font-mono text-gray-500" style={{ backgroundColor: rowBg, position: 'sticky', left: 196, zIndex: 10, padding: '4px 6px', width: 70, fontSize: 10 }}>
                        {user.tab_number}
                      </td>
                      {workstations.map((w) => {
                        const skill = userSkills.get(w.id)
                        const lvl = skill?.level_numeric ?? 0
                        const display = LEVEL_DISPLAY[lvl] ?? LEVEL_DISPLAY[0]
                        return (
                          <td
                            key={w.id}
                            className="border border-gray-100 text-center"
                            style={{
                              backgroundColor: lvl > 0 ? display.bg : rowBg,
                              width: 36,
                              minWidth: 36,
                              padding: 0,
                              height: 28,
                            }}
                            title={skill ? `${user.full_name} — ${w.name}: Daraja ${lvl}` : `${user.full_name} — ${w.name}: baholanmagan`}
                          >
                            {lvl > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: display.text }}>
                                {display.label}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
