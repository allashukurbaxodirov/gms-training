import { getSession } from '@/lib/auth'
import { getMyCourses } from '@/lib/queries/courses'
import { BookOpen, Clock, CheckCircle2, AlertCircle, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { PageLayout } from '@/components/ui/PageLayout'

type CourseRow = {
  id: string
  title: string
  thumbnail_url: string | null
  difficulty: string | null
  duration_minutes: number | null
  category: string | null
  is_mandatory: boolean
  enrollment_id: string
  status: string
  progress_percent: number | null
  started_at: string | null
  completed_at: string | null
  planned_date: string | null
  deadline: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  assigned:    { label: 'Tayinlangan',      color: '#6366f1', bg: '#eef2ff', icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: 'Jarayonda',        color: '#0B3D91', bg: '#eff6ff', icon: <BookOpen className="h-3 w-3" /> },
  completed:   { label: 'Tugatilgan',       color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle2 className="h-3 w-3" /> },
  failed:      { label: 'Muvaffaqiyatsiz',  color: '#ef4444', bg: '#fef2f2', icon: <AlertCircle className="h-3 w-3" /> },
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner:     'Boshlang\'ich',
  intermediate: 'O\'rta',
  advanced:     'Murakkab',
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'Functional':         { bg: '#eff6ff', color: '#3b82f6' },
  'GM-GMS':             { bg: '#f0fdf4', color: '#16a34a' },
  'Safety & Environment': { bg: '#fefce8', color: '#ca8a04' },
  'Safety&Environment': { bg: '#fefce8', color: '#ca8a04' },
  'Others':             { bg: '#faf5ff', color: '#9333ea' },
}

export default async function MyCoursesPage() {
  const session = await getSession()
  if (!session) return null

  let courses: CourseRow[] = []
  try {
    courses = await getMyCourses(session.id) as unknown as CourseRow[]
  } catch (e) {
    console.error('getMyCourses error:', e)
  }

  // Guruhlash: jarayonda → tayinlangan → tugatilgan → boshqalar
  const order = ['in_progress', 'assigned', 'completed', 'failed']
  const sorted = [...courses].sort((a, b) => {
    const ai = order.indexOf(a.status)
    const bi = order.indexOf(b.status)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const inProgressCount = courses.filter(c => c.status === 'in_progress').length
  const completedCount  = courses.filter(c => c.status === 'completed').length
  const assignedCount   = courses.filter(c => c.status === 'assigned').length

  return (
    <PageLayout
      title="Mening kurslarim"
      description={`Jami ${courses.length} ta kurs`}
    >
      {/* Stats row */}
      {courses.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Jarayonda',   count: inProgressCount, color: '#0B3D91', bg: '#eff6ff' },
            { label: 'Tayinlangan', count: assignedCount,   color: '#6366f1', bg: '#eef2ff' },
            { label: 'Tugatilgan',  count: completedCount,  color: '#10b981', bg: '#ecfdf5' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: s.bg, color: s.color }}>
                {s.count}
              </div>
              <span className="text-sm text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-[#0B3D91]" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Hozircha tayinlangan kurs yo&apos;q</p>
            <p className="text-sm text-gray-400 mt-1">Admin yoki HR tomonidan kurs tayinlanishi kutilmoqda</p>
          </div>
        </div>
      )}

      {/* Course cards */}
      {sorted.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((course) => {
            const st = STATUS_CONFIG[course.status] ?? STATUS_CONFIG['assigned']
            const cat = course.category ? CATEGORY_COLORS[course.category] : null
            const progress = course.progress_percent ?? 0
            return (
              <Link key={course.enrollment_id} href={`/my-courses/${course.id}`} className="block group">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all h-full flex flex-col">
                  {/* Top color stripe */}
                  <div
                    className="h-1 rounded-t-2xl"
                    style={{ backgroundColor: st.color }}
                  />

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Category + status */}
                    <div className="flex items-center justify-between gap-2">
                      {cat && course.category ? (
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: cat.bg, color: cat.color }}
                        >
                          {course.category.replace('Safety&Environment', 'Safety & Environment')}
                        </span>
                      ) : <span />}
                      <span
                        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: st.bg, color: st.color }}
                      >
                        {st.icon}
                        {st.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 flex-1 group-hover:text-[#0B3D91] transition-colors">
                      {course.title}
                    </h3>

                    {/* Progress bar (jarayonda yoki tugatilgan) */}
                    {(course.status === 'in_progress' || course.status === 'completed') && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Jarayon</span>
                          <span className="font-semibold" style={{ color: st.color }}>{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, backgroundColor: st.color }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {course.difficulty && (
                          <span>{DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}</span>
                        )}
                        {course.planned_date && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(course.planned_date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                        {course.is_mandatory && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-500 text-[10px] font-semibold">Majburiy</span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#0B3D91] transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
