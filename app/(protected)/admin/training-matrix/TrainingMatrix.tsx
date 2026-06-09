'use client'

import { useState, useMemo } from 'react'

interface Course {
  id: string
  title: string
  category: string | null
  difficulty: string
  is_mandatory: boolean
}

interface User {
  id: string
  tab_number: string
  full_name: string
  job_title: string | null
  shop_name: string | null
  trainer_name: string | null
}

interface Enrollment {
  user_id: string
  course_id: string
  status: string | null
  training_status: string | null
  planned_date: string | null
  delivered_date: string | null
  tested_date: string | null
  can_teach_date: string | null
  completed_at: string | null
  progress_percent: number
}

interface Props {
  courses: Record<string, unknown>[]
  users: Record<string, unknown>[]
  enrollments: Record<string, unknown>[]
}

// Kategoriya ranglari (Excel formatiga o'xshash)
const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Functional':         { bg: '#1e40af', text: '#ffffff', border: '#1e3a8a' },
  'GM-GMS':             { bg: '#0f766e', text: '#ffffff', border: '#0d6b62' },
  'Safety&Environment': { bg: '#b45309', text: '#ffffff', border: '#92400e' },
  'Others':             { bg: '#6b21a8', text: '#ffffff', border: '#581c87' },
}
const DEFAULT_CAT = { bg: '#374151', text: '#ffffff', border: '#1f2937' }

function fmtDate(d: string | null): string {
  if (!d) return ''
  try {
    const dt = new Date(d)
    const dd = String(dt.getDate()).padStart(2, '0')
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const yy = String(dt.getFullYear()).slice(-2)
    return `${dd}.${mm}.${yy}`
  } catch { return '' }
}

function getCellData(enrollment: Enrollment | undefined) {
  if (!enrollment) return { planned: '', actual: '', status: 'none' }
  const planned = enrollment.planned_date
    ? fmtDate(enrollment.planned_date)
    : enrollment.status === 'assigned' ? '—' : ''
  const actual = enrollment.completed_at
    ? fmtDate(enrollment.completed_at)
    : enrollment.delivered_date
    ? fmtDate(enrollment.delivered_date)
    : ''
  const status = enrollment.status ?? 'none'
  return { planned, actual, status }
}

const STATUS_BG: Record<string, string> = {
  completed:   '#dcfce7',
  in_progress: '#fef9c3',
  assigned:    '#eff6ff',
  failed:      '#fee2e2',
  none:        '',
}

export function TrainingMatrix({ courses: rawCourses, users: rawUsers, enrollments: rawEnrollments }: Props) {
  const courses = rawCourses as unknown as Course[]
  const users = rawUsers as unknown as User[]
  const enrollments = rawEnrollments as unknown as Enrollment[]

  const [search, setSearch] = useState('')
  const [shopFilter, setShopFilter] = useState('')

  // Build lookup map: userId → courseId → Enrollment
  const enrollMap = useMemo(() => {
    const map = new Map<string, Map<string, Enrollment>>()
    enrollments.forEach((e) => {
      if (!map.has(e.user_id)) map.set(e.user_id, new Map())
      map.get(e.user_id)!.set(e.course_id, e)
    })
    return map
  }, [enrollments])

  // Unique categories (in order)
  const categories = useMemo(() => {
    const catOrder = ['Functional', 'GM-GMS', 'Safety&Environment', 'Others']
    const seen = new Set<string>()
    const result: string[] = []
    // First add ordered ones
    catOrder.forEach((c) => {
      if (courses.some((co) => (co.category ?? 'Others') === c)) {
        seen.add(c)
        result.push(c)
      }
    })
    // Then any remaining
    courses.forEach((co) => {
      const cat = co.category ?? 'Others'
      if (!seen.has(cat)) { seen.add(cat); result.push(cat) }
    })
    return result
  }, [courses])

  // Group courses by category
  const coursesByCategory = useMemo(() => {
    const map = new Map<string, Course[]>()
    categories.forEach((c) => map.set(c, []))
    courses.forEach((co) => {
      const cat = co.category ?? 'Others'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(co)
    })
    return map
  }, [courses, categories])

  // Unique shops
  const shops = useMemo(() => {
    const s = [...new Set(users.map((u) => u.shop_name).filter(Boolean))] as string[]
    return s.sort()
  }, [users])

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (shopFilter && u.shop_name !== shopFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return u.full_name.toLowerCase().includes(q) ||
          u.tab_number.toLowerCase().includes(q) ||
          (u.job_title ?? '').toLowerCase().includes(q)
      }
      return true
    })
  }, [users, search, shopFilter])

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-16 text-center text-gray-400">
        Nashr etilgan kurslar yo&apos;q
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Xodim nomi yoki tabel raqam..."
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
            {shops.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <span className="text-xs text-gray-400">{filteredUsers.length} xodim ko&apos;rsatilmoqda</span>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {[
            { color: '#dcfce7', label: 'Tugatildi' },
            { color: '#fef9c3', label: 'Jarayonda' },
            { color: '#eff6ff', label: 'Tayinlangan' },
            { color: '#fee2e2', label: 'Muvaffaqiyatsiz' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded border border-gray-300" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Matrix table */}
      <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <table className="border-collapse text-xs" style={{ minWidth: 'max-content' }}>
            <thead>
              {/* === ROW 1: Title row === */}
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-center font-bold text-white text-sm border border-[#1e3a8a]"
                  style={{ backgroundColor: '#0B3D91', position: 'sticky', left: 0, zIndex: 30 }}
                >
                  Xodimlarni o&apos;qitish grafigi — {new Date().getFullYear()} yil
                </td>
                {categories.map((cat) => {
                  const catCourses = coursesByCategory.get(cat) ?? []
                  const col = CAT_COLORS[cat] ?? DEFAULT_CAT
                  return (
                    <td
                      key={cat}
                      colSpan={catCourses.length}
                      className="px-2 py-2 text-center font-bold text-xs border"
                      style={{ backgroundColor: col.bg, color: col.text, borderColor: col.border }}
                    >
                      {cat}
                    </td>
                  )
                })}
              </tr>

              {/* === ROW 2: Column headers (rotated course titles) === */}
              <tr>
                {/* Sticky left headers */}
                {[
                  { label: '№', w: 36 },
                  { label: 'Lavozimi', w: 130 },
                  { label: 'Tab №', w: 70 },
                  { label: 'F.I.Sh', w: 160 },
                  { label: 'O\'qituvchi', w: 130 },
                ].map((h, i) => (
                  <th
                    key={h.label}
                    rowSpan={2}
                    className="border border-gray-300 font-semibold text-white text-center"
                    style={{
                      backgroundColor: '#0B3D91',
                      position: 'sticky',
                      left: [0,36,166,236,396][i],
                      zIndex: 20,
                      width: h.w,
                      minWidth: h.w,
                      maxWidth: h.w,
                      verticalAlign: 'middle',
                      padding: '4px 6px',
                    }}
                  >
                    {h.label}
                  </th>
                ))}

                {/* Course title cells (rotated) */}
                {categories.flatMap((cat) => {
                  const catCourses = coursesByCategory.get(cat) ?? []
                  const col = CAT_COLORS[cat] ?? DEFAULT_CAT
                  return catCourses.map((course) => (
                    <th
                      key={course.id}
                      className="border font-medium"
                      style={{
                        backgroundColor: col.bg + 'dd',
                        color: col.text,
                        borderColor: col.border,
                        width: 44,
                        minWidth: 44,
                        height: 140,
                        padding: 0,
                        verticalAlign: 'bottom',
                      }}
                    >
                      <div
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          padding: '6px 4px',
                          fontSize: 10,
                          lineHeight: 1.2,
                          maxHeight: 134,
                          overflow: 'hidden',
                          fontWeight: course.is_mandatory ? 700 : 500,
                        }}
                        title={course.title}
                      >
                        {course.is_mandatory ? '★ ' : ''}{course.title}
                      </div>
                    </th>
                  ))
                })}
              </tr>

              {/* === ROW 3: Reja/Fakt labels === */}
              <tr>
                {categories.flatMap((cat) => {
                  const catCourses = coursesByCategory.get(cat) ?? []
                  const col = CAT_COLORS[cat] ?? DEFAULT_CAT
                  return catCourses.map((course) => (
                    <td
                      key={course.id}
                      className="border text-center"
                      style={{
                        backgroundColor: col.bg + '44',
                        borderColor: col.border + '88',
                        padding: '2px 1px',
                      }}
                    >
                      <div style={{ fontSize: 8, color: col.bg, lineHeight: 1.1 }}>
                        <div style={{ borderBottom: '1px solid ' + col.border + '44', paddingBottom: 1 }}>Reja</div>
                        <div style={{ paddingTop: 1 }}>Fakt</div>
                      </div>
                    </td>
                  ))
                })}
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + courses.length}
                    className="py-16 text-center text-gray-400"
                  >
                    Xodimlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, rowIdx) => {
                  const userEnrolls = enrollMap.get(user.id) ?? new Map()
                  const isEven = rowIdx % 2 === 0
                  const rowBg = isEven ? '#ffffff' : '#f8fafc'

                  return (
                    <tr key={user.id} style={{ backgroundColor: rowBg }}>
                      {/* Fixed left cells */}
                      <td
                        className="border border-gray-200 text-center font-medium text-gray-500"
                        style={{ backgroundColor: rowBg, position: 'sticky', left: 0, zIndex: 10, padding: '4px 6px', width: 36, minWidth: 36 }}
                      >
                        {rowIdx + 1}
                      </td>
                      <td
                        className="border border-gray-200 text-gray-800"
                        style={{ backgroundColor: rowBg, position: 'sticky', left: 36, zIndex: 10, padding: '4px 6px', width: 130, minWidth: 130, maxWidth: 130 }}
                        title={user.job_title ?? ''}
                      >
                        <div className="truncate">{user.job_title ?? '—'}</div>
                        {user.shop_name && (
                          <div style={{ fontSize: 9, color: '#9ca3af' }} className="truncate">{user.shop_name}</div>
                        )}
                      </td>
                      <td
                        className="border border-gray-200 text-center font-mono text-gray-600"
                        style={{ backgroundColor: rowBg, position: 'sticky', left: 166, zIndex: 10, padding: '4px 6px', width: 70, minWidth: 70, fontSize: 10 }}
                      >
                        {user.tab_number}
                      </td>
                      <td
                        className="border border-gray-200 font-medium text-gray-900"
                        style={{ backgroundColor: rowBg, position: 'sticky', left: 236, zIndex: 10, padding: '4px 6px', width: 160, minWidth: 160, maxWidth: 160 }}
                      >
                        <div className="truncate" style={{ fontSize: 11 }}>{user.full_name}</div>
                      </td>
                      <td
                        className="border border-gray-200 text-gray-500"
                        style={{ backgroundColor: rowBg, position: 'sticky', left: 396, zIndex: 10, padding: '4px 6px', width: 130, minWidth: 130, maxWidth: 130 }}
                      >
                        <div className="truncate" style={{ fontSize: 10 }}>{user.trainer_name ?? '—'}</div>
                      </td>

                      {/* Course cells */}
                      {categories.flatMap((cat) => {
                        const catCourses = coursesByCategory.get(cat) ?? []
                        const col = CAT_COLORS[cat] ?? DEFAULT_CAT
                        return catCourses.map((course) => {
                          const enroll = userEnrolls.get(course.id)
                          const { planned, actual, status } = getCellData(enroll)
                          const cellBg = status !== 'none' ? STATUS_BG[status] ?? '' : ''

                          return (
                            <td
                              key={course.id}
                              className="border text-center"
                              style={{
                                borderColor: col.border + '33',
                                backgroundColor: cellBg || (isEven ? '#ffffff' : '#f8fafc'),
                                width: 44,
                                minWidth: 44,
                                padding: 0,
                              }}
                              title={enroll ? `${course.title} — ${status}` : course.title}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '2px 1px' }}>
                                {/* Planned date */}
                                <div
                                  style={{
                                    fontSize: 8,
                                    color: planned ? '#1d4ed8' : '#d1d5db',
                                    minHeight: 12,
                                    lineHeight: 1,
                                    borderBottom: '1px solid ' + (col.border + '22'),
                                    width: '100%',
                                    paddingBottom: 1,
                                    textAlign: 'center',
                                  }}
                                >
                                  {planned || ''}
                                </div>
                                {/* Actual date */}
                                <div
                                  style={{
                                    fontSize: 8,
                                    color: actual ? '#15803d' : '#d1d5db',
                                    minHeight: 12,
                                    lineHeight: 1,
                                    width: '100%',
                                    paddingTop: 1,
                                    textAlign: 'center',
                                    fontWeight: actual ? 700 : 400,
                                  }}
                                >
                                  {actual || ''}
                                </div>
                              </div>
                            </td>
                          )
                        })
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
