import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCourseById } from '@/lib/queries/courses'
import { CoursePlayerClient } from './CoursePlayerClient'
import type { TestData } from './TestPlayer'
import { Clock, BookOpen, BarChart2, Award, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const difficultyLabel: Record<string, string> = {
  beginner: 'Boshlang\'ich',
  intermediate: 'O\'rta',
  advanced: 'Murakkab',
}

export default async function CoursePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return null

  type CourseData = Record<string, unknown> & { lessons: unknown[]; tests: unknown[] }
  let course: CourseData | null = null
  try {
    course = await getCourseById(id, session.id) as CourseData
  } catch {}

  if (!course) notFound()

  const c = course as CourseData
  const lessons = (c.lessons ?? []) as Record<string, unknown>[]
  const tests = (c.tests ?? []) as TestData[]
  const progress = Number(c.progress_percent ?? 0)
  const enrollmentId = c.enrollment_id as string | null

  return (
    <div className="space-y-5">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Link href="/my-courses" className="mt-1 text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 line-clamp-2">{c.title as string}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5" />
              {difficultyLabel[c.difficulty as string] ?? c.difficulty as string}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {c.duration_minutes as number} daqiqa
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {lessons.length} ta dars
            </span>
            {tests.length > 0 && (
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5" />
                {tests.length} ta test
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold" style={{ color: '#0B3D91' }}>{progress}%</p>
          <p className="text-xs text-gray-400">Bajarildi</p>
        </div>
      </div>

      {/* ─── Progress bar ───────────────────────────────────── */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress}%`, backgroundColor: '#FFB81C' }}
        />
      </div>

      {/* ─── Darslar + Test (client component) ─────────────── */}
      <CoursePlayerClient
        lessons={lessons as unknown as Parameters<typeof CoursePlayerClient>[0]['lessons']}
        tests={tests}
        enrollmentId={enrollmentId}
        initialProgress={progress}
        courseId={id}
        userId={session.id}
      />
    </div>
  )
}
