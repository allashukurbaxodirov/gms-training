import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCourseById, getLessons, getTestByCourse, getQuestions } from '@/lib/queries/courses'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { CourseEditor } from './CourseEditor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  let course: Record<string, unknown> | null = null
  try {
    course = await getCourseById(id) as Record<string, unknown>
  } catch {}
  if (!course) notFound()

  // Load lessons + test in parallel
  const [lessons, test] = await Promise.all([
    getLessons(id).catch(() => []),
    getTestByCourse(id).catch(() => null),
  ])

  // Load questions if test exists
  const questions = test ? await getQuestions(test.id).catch(() => []) : []
  const testWithQuestions = test ? { ...test, questions: questions as typeof questions & { test_id: string }[] } : null

  const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
    'Functional': { bg: '#dbeafe', text: '#1d4ed8' },
    'GM-GMS': { bg: '#dcfce7', text: '#15803d' },
    'Safety & Environment': { bg: '#fef9c3', text: '#a16207' },
    'Safety&Environment': { bg: '#fef9c3', text: '#a16207' },
    'Others': { bg: '#f3e8ff', text: '#6b21a8' },
  }
  const cat = course.category as string | null
  const catStyle = cat ? CATEGORY_STYLES[cat] ?? { bg: '#f3f4f6', text: '#6b7280' } : null

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/admin/courses"
          className="mt-1 p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">{course.title as string}</h1>
            {catStyle && cat && (
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
              >
                {cat.replace('Safety&Environment', 'Safety & Environment')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Kurs muharriri · {lessons.length} dars · {questions.length} savol
          </p>
        </div>
      </div>

      {/* Editor with tabs */}
      <CourseEditor
        course={course}
        lessons={lessons as Parameters<typeof CourseEditor>[0]['lessons']}
        test={testWithQuestions as Parameters<typeof CourseEditor>[0]['test']}
      />
    </div>
  )
}
