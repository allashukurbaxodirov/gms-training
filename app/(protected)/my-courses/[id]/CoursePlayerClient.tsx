'use client'

import { useState } from 'react'
import { BookOpen, ClipboardList } from 'lucide-react'
import { LessonViewer } from './LessonViewer'
import type { Lesson } from './LessonViewer'
import { TestPlayer } from './TestPlayer'
import type { TestData } from './TestPlayer'

interface CoursePlayerClientProps {
  lessons: Lesson[]
  tests: TestData[]
  enrollmentId: string | null
  initialProgress: number
  courseId: string
  userId: string
}

export function CoursePlayerClient({
  lessons,
  tests,
  enrollmentId,
  initialProgress,
  courseId,
  userId,
}: CoursePlayerClientProps) {
  const hasTest = tests.length > 0

  // Barcha darslar tugatilganmi?
  // initialProgress >= 90 → oldin ham darslar tugatilgan (yoki kurs allaqachon completed=100%)
  const [allLessonsDone, setAllLessonsDone] = useState<boolean>(
    lessons.length === 0 || initialProgress >= 90
  )

  return (
    <>
      {/* ─── Darslar ─────────────────────────────────────────── */}
      {lessons.length > 0 ? (
        <LessonViewer
          lessons={lessons}
          enrollmentId={enrollmentId}
          initialProgress={initialProgress}
          courseId={courseId}
          hasTest={hasTest}
          onAllLessonsDone={() => setAllLessonsDone(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
          <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Darslar hali qo&apos;shilmagan</p>
          <p className="text-xs text-gray-300 mt-1">
            Administrator kursga dars qo&apos;shganda bu yerda ko&apos;rinadi
          </p>
        </div>
      )}

      {/* ─── Test(lar) ───────────────────────────────────────── */}
      {hasTest && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#0B3D91]" />
            <h2 className="font-semibold text-gray-800">Kurs testi</h2>
            {!allLessonsDone && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Avval darslarni tugating
              </span>
            )}
          </div>
          {tests.map(test => (
            <TestPlayer
              key={test.id}
              test={test}
              enrollmentId={enrollmentId}
              courseId={courseId}
              userId={userId}
              locked={!allLessonsDone && lessons.length > 0}
            />
          ))}
        </div>
      )}
    </>
  )
}
