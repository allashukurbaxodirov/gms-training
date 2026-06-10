'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search, BookOpen, CheckCircle2, Play, Plus,
  AlertTriangle, ChevronRight, Clock, Calendar,
  LayoutGrid, Table2,
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  category: string | null
  difficulty: string
  duration_minutes: number
  is_mandatory: boolean
  passing_score: number
  thumbnail_url: string | null
  scheduled_month: number | null
  enrollment_id: string | null
  enrollment_status: string | null
  training_status: string | null
  planned_date: string | null
  delivered_date: string | null
  progress_percent: number
}

interface Props {
  courses: Record<string, unknown>[]
}

// ─── Konstantalar ────────────────────────────────────────────────
const COLS = [
  { key: 'Functional',         label: 'Functional',          color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'GM-GMS',             label: 'GM-GMS',              color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  { key: 'Safety&Environment', label: 'Safety & Environment', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { key: 'Others',             label: 'Boshqa',              color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff' },
]

const MONTHS = [
  { num: 1,  label: 'Yanvar' },
  { num: 2,  label: 'Fevral' },
  { num: 3,  label: 'Mart' },
  { num: 4,  label: 'April' },
  { num: 5,  label: 'May' },
  { num: 6,  label: 'Iyun' },
  { num: 7,  label: 'Iyul' },
  { num: 8,  label: 'Avgust' },
  { num: 9,  label: 'Sentabr' },
  { num: 10, label: 'Oktabr' },
  { num: 11, label: 'Noyabr' },
  { num: 12, label: 'Dekabr' },
]

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  assigned:    { label: 'Tayinlangan', color: '#6b7280', dot: '#d1d5db' },
  in_progress: { label: 'Jarayonda',  color: '#d97706', dot: '#fbbf24' },
  completed:   { label: 'Tugatildi',  color: '#059669', dot: '#34d399' },
  failed:      { label: 'Topshiring', color: '#dc2626', dot: '#f87171' },
}

const DIFF_COLOR: Record<string, string> = {
  beginner:     '#10b981',
  intermediate: '#f59e0b',
  advanced:     '#ef4444',
}

const DIFF_LABEL: Record<string, string> = {
  beginner:     "Boshlang'ich",
  intermediate: "O'rta",
  advanced:     'Murakkab',
}

// ─── Asosiy komponent ─────────────────────────────────────────────
export function LearningPlanView({ courses: raw }: Props) {
  const router   = useRouter()
  const courses  = raw as unknown as Course[]

  const [search,      setSearch]      = useState('')
  const [viewMode,    setViewMode]    = useState<'matrix' | 'cards'>('matrix')
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [expandedCell, setExpandedCell] = useState<string | null>(null)

  // Stats
  const total     = courses.length
  const enrolled  = courses.filter((c) => c.enrollment_id).length
  const completed = courses.filter((c) => c.enrollment_status === 'completed').length
  const mandatory = courses.filter((c) => c.is_mandatory).length

  // Search filter
  const filtered = useMemo(() =>
    courses.filter((c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(search.toLowerCase())
    ), [courses, search])

  // Matrix: { month -> { category -> Course[] } }
  const matrix = useMemo(() => {
    const m = new Map<number | 'none', Map<string, Course[]>>()
    filtered.forEach((c) => {
      const monthKey = c.scheduled_month ?? 'none'
      if (!m.has(monthKey)) m.set(monthKey, new Map())
      const cat = c.category ?? 'Others'
      if (!m.get(monthKey)!.has(cat)) m.get(monthKey)!.set(cat, [])
      m.get(monthKey)!.get(cat)!.push(c)
    })
    return m
  }, [filtered])

  // Rows: only months that have courses + unscheduled
  const rows = useMemo(() => {
    const result: Array<{ num: number | 'none'; label: string }> = []
    MONTHS.forEach((m) => {
      if (matrix.has(m.num)) result.push({ num: m.num, label: m.label })
    })
    if (matrix.has('none')) result.push({ num: 'none', label: "Rejalashtirilmagan" })
    return result
  }, [matrix])

  // Visible columns: only cols that have at least one course
  const visibleCols = useMemo(() =>
    COLS.filter((col) =>
      filtered.some((c) => (c.category ?? 'Others') === col.key)
    ), [filtered])

  async function handleEnroll(courseId: string) {
    setEnrollingId(courseId)
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Kursga muvaffaqiyatli yozildingiz!')
      router.refresh()
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setEnrollingId(null)
    }
  }

  function handleOpen(course: Course) {
    if (course.enrollment_id) router.push(`/my-courses/${course.id}`)
    else handleEnroll(course.id)
  }

  return (
    <div className="space-y-4">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Jami kurslar',  value: total,     color: '#0B3D91', icon: <BookOpen className="h-5 w-5" /> },
          { label: 'Yozilganlar',   value: enrolled,  color: '#3b82f6', icon: <Calendar className="h-5 w-5" /> },
          { label: 'Tugatilganlar', value: completed, color: '#10b981', icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: 'Majburiy',      value: mandatory, color: '#f59e0b', icon: <AlertTriangle className="h-5 w-5" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: s.color + '18', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Kurs nomini qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <p className="text-xs text-gray-400">{filtered.length} ta kurs</p>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'matrix' ? 'bg-white shadow text-[#0B3D91]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" /> Matriks
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'cards' ? 'bg-white shadow text-[#0B3D91]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kartalar
          </button>
        </div>
      </div>

      {/* ── Matriks ko'rinishi ── */}
      {viewMode === 'matrix' && (
        filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Legend */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Holat:</span>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.dot }} />
                  {v.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full bg-gray-200" />
                Yozilmagan
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {/* Month header */}
                    <th className="w-28 min-w-[6.5rem] p-3 text-left border-b border-r border-gray-100 bg-gray-50">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Oy</span>
                    </th>
                    {visibleCols.map((col) => (
                      <th key={col.key} className="p-3 text-left border-b border-gray-100"
                        style={{ backgroundColor: col.bg }}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                          <span className="text-xs font-bold" style={{ color: col.color }}>{col.label}</span>
                          <span className="ml-auto text-[10px] font-medium text-gray-400 bg-white/70 px-1.5 py-0.5 rounded-full border"
                            style={{ borderColor: col.border }}>
                            {filtered.filter((c) => (c.category ?? 'Others') === col.key).length} ta
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={String(row.num)} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      {/* Month label */}
                      <td className="p-3 border-r border-gray-100 align-top">
                        <div className="flex flex-col gap-0.5">
                          {row.num !== 'none' ? (
                            <>
                              <span className="text-xs font-bold text-gray-700">{row.label}</span>
                              <span className="text-[10px] text-gray-400">{row.num}-oy</span>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-gray-400 italic">{row.label}</span>
                          )}
                        </div>
                      </td>

                      {/* Category cells */}
                      {visibleCols.map((col) => {
                        const cellKey = `${row.num}-${col.key}`
                        const cellCourses = matrix.get(row.num)?.get(col.key) ?? []
                        const isExpanded = expandedCell === cellKey
                        const showLimit = 3
                        const displayed = isExpanded ? cellCourses : cellCourses.slice(0, showLimit)

                        return (
                          <td key={col.key} className="p-2 align-top border-gray-100 min-w-[180px]">
                            {cellCourses.length === 0 ? (
                              <div className="h-8 flex items-center justify-center">
                                <span className="text-[10px] text-gray-200">—</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {displayed.map((c) => (
                                  <MatrixCourseChip
                                    key={c.id}
                                    course={c}
                                    colColor={col.color}
                                    colBg={col.bg}
                                    enrollingId={enrollingId}
                                    onAction={handleOpen}
                                  />
                                ))}
                                {!isExpanded && cellCourses.length > showLimit && (
                                  <button
                                    onClick={() => setExpandedCell(cellKey)}
                                    className="text-[10px] font-medium px-2 py-1 rounded-md w-full text-center transition-colors"
                                    style={{ color: col.color, backgroundColor: col.bg }}
                                  >
                                    +{cellCourses.length - showLimit} ta ko'proq
                                  </button>
                                )}
                                {isExpanded && cellCourses.length > showLimit && (
                                  <button
                                    onClick={() => setExpandedCell(null)}
                                    className="text-[10px] font-medium px-2 py-1 rounded-md w-full text-center text-gray-400 hover:text-gray-600"
                                  >
                                    Yig'ish ▲
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Kartalar ko'rinishi ── */}
      {viewMode === 'cards' && (
        filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-5">
            {COLS.filter((col) => filtered.some((c) => (c.category ?? 'Others') === col.key)).map((col) => {
              const catCourses = filtered.filter((c) => (c.category ?? 'Others') === col.key)
              return (
                <div key={col.key}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: col.color }}>
                      {col.label}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {catCourses.length} ta kurs
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        colColor={col.color}
                        enrollingId={enrollingId}
                        onAction={handleOpen}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

// ─── Matriks chip ─────────────────────────────────────────────────
function MatrixCourseChip({
  course, colColor, colBg, enrollingId, onAction,
}: {
  course: Course
  colColor: string
  colBg: string
  enrollingId: string | null
  onAction: (c: Course) => void
}) {
  const isEnrolled  = !!course.enrollment_id
  const isCompleted = course.enrollment_status === 'completed'
  const isProgress  = course.enrollment_status === 'in_progress'
  const statusConf  = course.enrollment_status ? STATUS_MAP[course.enrollment_status] : null
  const isLoading   = enrollingId === course.id

  return (
    <button
      onClick={() => onAction(course)}
      disabled={isLoading}
      className="w-full text-left rounded-lg border px-2.5 py-2 transition-all hover:shadow-sm group disabled:opacity-60"
      style={{
        backgroundColor: isCompleted ? '#f0fdf4' : isProgress ? '#fffbeb' : isEnrolled ? '#eff6ff' : 'white',
        borderColor: isCompleted ? '#86efac' : isProgress ? '#fde68a' : isEnrolled ? '#bfdbfe' : '#e5e7eb',
      }}
    >
      <div className="flex items-start gap-2">
        {/* Status dot */}
        <span className="mt-1 w-2 h-2 rounded-full shrink-0 transition-all"
          style={{
            backgroundColor: isCompleted ? '#34d399' : isProgress ? '#fbbf24' : isEnrolled ? '#60a5fa' : '#d1d5db',
          }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#0B3D91] transition-colors">
            {course.title}
          </p>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {course.is_mandatory && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200">
                <AlertTriangle className="h-2 w-2" /> MAJ
              </span>
            )}
            <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" /> {course.duration_minutes}d
            </span>
            {statusConf && (
              <span className="text-[9px] font-medium" style={{ color: statusConf.color }}>
                {statusConf.label}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {isEnrolled && !isCompleted && course.progress_percent > 0 && (
            <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${course.progress_percent}%`,
                backgroundColor: colColor,
              }} />
            </div>
          )}
        </div>

        {/* Action icon */}
        <div className="shrink-0 flex items-center">
          {isLoading ? (
            <span className="text-[9px] text-gray-400">...</span>
          ) : isCompleted ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : isEnrolled ? (
            <Play className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colColor }} />
          ) : (
            <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Karta ko'rinishi ─────────────────────────────────────────────
function CourseCard({
  course, colColor, enrollingId, onAction,
}: {
  course: Course
  colColor: string
  enrollingId: string | null
  onAction: (c: Course) => void
}) {
  const isEnrolled  = !!course.enrollment_id
  const isCompleted = course.enrollment_status === 'completed'
  const isProgress  = course.enrollment_status === 'in_progress'
  const statusConf  = course.enrollment_status ? STATUS_MAP[course.enrollment_status] : null
  const isLoading   = enrollingId === course.id

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onAction(course)}
    >
      <div className="h-1.5" style={{
        background: isCompleted
          ? 'linear-gradient(90deg,#10b981,#34d399)'
          : isProgress
          ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
          : `linear-gradient(90deg,${colColor},${colColor}99)`,
      }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {course.is_mandatory && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
              <AlertTriangle className="h-2.5 w-2.5" /> MAJBURIY
            </span>
          )}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: DIFF_COLOR[course.difficulty], backgroundColor: DIFF_COLOR[course.difficulty] + '18' }}>
            {DIFF_LABEL[course.difficulty] ?? course.difficulty}
          </span>
          {statusConf && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: statusConf.color, backgroundColor: statusConf.dot + '30' }}>
              {statusConf.label}
            </span>
          )}
          {course.scheduled_month && (
            <span className="text-[10px] text-gray-400 ml-auto">
              {MONTHS.find((m) => m.num === course.scheduled_month)?.label}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2 group-hover:text-[#0B3D91] transition-colors">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{course.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {course.duration_minutes} daq
          </span>
        </div>

        {isEnrolled && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span className="font-medium">{course.progress_percent}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${course.progress_percent}%`, backgroundColor: isCompleted ? '#10b981' : colColor }} />
            </div>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onAction(course) }}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
          style={
            isCompleted
              ? { backgroundColor: '#d1fae5', color: '#065f46' }
              : isEnrolled
              ? { backgroundColor: colColor, color: 'white' }
              : { backgroundColor: '#f3f4f6', color: '#374151' }
          }
        >
          {isLoading ? 'Yozilmoqda...'
            : isCompleted ? <><CheckCircle2 className="h-3.5 w-3.5" /> Tugatildi</>
            : isProgress  ? <><Play className="h-3.5 w-3.5" /> Davom etish <ChevronRight className="h-3.5 w-3.5" /></>
            : isEnrolled  ? <><Play className="h-3.5 w-3.5" /> Boshlash <ChevronRight className="h-3.5 w-3.5" /></>
            : <><Plus className="h-3.5 w-3.5" /> Yozilish</>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Bo'sh holat ──────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
      <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-400">Kurslar topilmadi</p>
    </div>
  )
}
