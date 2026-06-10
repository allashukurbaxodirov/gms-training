'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search, BookOpen, Clock, BarChart2, CheckCircle2,
  Play, Plus, AlertTriangle, Filter, ChevronRight,
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
  enrollment_id: string | null
  enrollment_status: string | null
  progress_percent: number
}

interface Props {
  courses: Record<string, unknown>[]
}

const CATEGORY_LABEL: Record<string, string> = {
  'Functional':         'Functional',
  'GM-GMS':             'GM-GMS',
  'Safety&Environment': 'Safety & Environment',
  'Others':             'Boshqa',
}

const CATEGORY_COLOR: Record<string, string> = {
  'Functional':         '#1e40af',
  'GM-GMS':             '#0f766e',
  'Safety&Environment': '#b45309',
  'Others':             '#6b21a8',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Boshlang\'ich',
  intermediate: 'O\'rta',
  advanced: 'Murakkab',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  assigned:    { label: 'Tayinlangan', color: '#6b7280', bg: '#f3f4f6' },
  in_progress: { label: 'Jarayonda',   color: '#f59e0b', bg: '#fef3c7' },
  completed:   { label: 'Tugatildi',   color: '#10b981', bg: '#d1fae5' },
  failed:      { label: 'Qayta topshiring', color: '#ef4444', bg: '#fee2e2' },
}

export function LearningPlanView({ courses: raw }: Props) {
  const router = useRouter()
  const courses = raw as unknown as Course[]

  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  // Unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(courses.map((c) => c.category).filter(Boolean))] as string[]
    return cats.sort()
  }, [courses])

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
          !(c.description ?? '').toLowerCase().includes(search.toLowerCase()) &&
          !(c.category ?? '').toLowerCase().includes(search.toLowerCase())) return false
      if (filterCat && c.category !== filterCat) return false
      if (filterDiff && c.difficulty !== filterDiff) return false
      if (filterStatus === 'enrolled' && !c.enrollment_id) return false
      if (filterStatus === 'not_enrolled' && c.enrollment_id) return false
      if (filterStatus === 'completed' && c.enrollment_status !== 'completed') return false
      if (filterStatus === 'in_progress' && c.enrollment_status !== 'in_progress') return false
      return true
    })
  }, [courses, search, filterCat, filterDiff, filterStatus])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, Course[]>()
    filtered.forEach((c) => {
      const cat = c.category ?? 'Boshqa'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(c)
    })
    return map
  }, [filtered])

  // Stats
  const total = courses.length
  const enrolled = courses.filter((c) => c.enrollment_id).length
  const completed = courses.filter((c) => c.enrollment_status === 'completed').length
  const mandatory = courses.filter((c) => c.is_mandatory).length

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
    if (course.enrollment_id) {
      router.push(`/my-courses/${course.id}`)
    } else {
      handleEnroll(course.id)
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Jami kurslar',  value: total,     color: '#0B3D91', icon: <BookOpen className="h-5 w-5" /> },
          { label: 'Yozilganlar',   value: enrolled,  color: '#3b82f6', icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: 'Tugatilganlar', value: completed, color: '#10b981', icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: 'Majburiy',      value: mandatory, color: '#f59e0b', icon: <AlertTriangle className="h-5 w-5" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: s.color + '15', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Kurs nomini qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          {categories.length > 0 && (
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white"
            >
              <option value="">Barcha bo&apos;lim</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select
            value={filterDiff}
            onChange={(e) => setFilterDiff(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white"
          >
            <option value="">Barcha daraja</option>
            <option value="beginner">Boshlang&apos;ich</option>
            <option value="intermediate">O&apos;rta</option>
            <option value="advanced">Murakkab</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white"
          >
            <option value="">Barcha holat</option>
            <option value="not_enrolled">Yozilmagan</option>
            <option value="enrolled">Yozilgan</option>
            <option value="in_progress">Jarayonda</option>
            <option value="completed">Tugatilgan</option>
          </select>
        </div>
        <p className="self-center text-xs text-gray-400 ml-auto">{filtered.length} ta kurs</p>
      </div>

      {/* Course groups */}
      {grouped.size === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
          <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Kurslar topilmadi</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, catCourses]) => (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[category] ?? '#0B3D91' }} />
              <span
                className="text-xs font-bold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: CATEGORY_COLOR[category] ?? '#0B3D91' }}
              >
                {CATEGORY_LABEL[category] ?? category}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{catCourses.length} ta kurs</span>
            </div>

            {/* Cards grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {catCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  enrollingId={enrollingId}
                  onAction={handleOpen}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function CourseCard({
  course,
  enrollingId,
  onAction,
}: {
  course: Course
  enrollingId: string | null
  onAction: (c: Course) => void
}) {
  const isEnrolled = !!course.enrollment_id
  const isCompleted = course.enrollment_status === 'completed'
  const isInProgress = course.enrollment_status === 'in_progress'
  const status = course.enrollment_status ? STATUS_CONFIG[course.enrollment_status] : null
  const diffColor = DIFFICULTY_COLOR[course.difficulty] ?? '#6b7280'
  const isLoading = enrollingId === course.id

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onAction(course)}
    >
      {/* Top color bar */}
      <div
        className="h-1.5"
        style={{
          background: isCompleted
            ? 'linear-gradient(90deg, #10b981, #34d399)'
            : isInProgress
            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
            : 'linear-gradient(90deg, #0B3D91, #1a52b3)',
        }}
      />

      <div className="p-4">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {course.is_mandatory && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
              <AlertTriangle className="h-2.5 w-2.5" /> MAJBURIY
            </span>
          )}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: diffColor, backgroundColor: diffColor + '18' }}
          >
            {DIFFICULTY_LABEL[course.difficulty] ?? course.difficulty}
          </span>
          {status && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: status.color, backgroundColor: status.bg }}
            >
              {status.label}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2 group-hover:text-[#0B3D91] transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{course.description}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.duration_minutes} daq
          </span>
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            {course.passing_score}% o&apos;tish bali
          </span>
        </div>

        {/* Progress bar (if enrolled) */}
        {isEnrolled && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span className="font-medium">{course.progress_percent}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${course.progress_percent}%`,
                  backgroundColor: isCompleted ? '#10b981' : '#FFB81C',
                }}
              />
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={(e) => { e.stopPropagation(); onAction(course) }}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
          style={
            isCompleted
              ? { backgroundColor: '#d1fae5', color: '#065f46' }
              : isEnrolled
              ? { backgroundColor: '#0B3D91', color: 'white' }
              : { backgroundColor: '#f3f4f6', color: '#374151' }
          }
        >
          {isLoading ? (
            'Yozilmoqda...'
          ) : isCompleted ? (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Tugatildi</>
          ) : isInProgress ? (
            <><Play className="h-3.5 w-3.5" /> Davom etish <ChevronRight className="h-3.5 w-3.5" /></>
          ) : isEnrolled ? (
            <><Play className="h-3.5 w-3.5" /> Boshlash <ChevronRight className="h-3.5 w-3.5" /></>
          ) : (
            <><Plus className="h-3.5 w-3.5" /> Yozilish</>
          )}
        </button>
      </div>
    </div>
  )
}
