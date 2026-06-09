'use client'

import { useState } from 'react'
import { CourseForm } from '../CourseForm'
import { LessonsTab } from './LessonsTab'
import { TestTab } from './TestTab'
import { FeedbackTab } from './FeedbackTab'
import type { Lesson, Test, Question } from '@/lib/queries/courses'
import { Info, BookOpen, ClipboardList, MessageSquare } from 'lucide-react'

interface QuestionWithTest extends Question {
  test_id: string
}

interface TestWithQuestions extends Test {
  questions: QuestionWithTest[]
}

interface Props {
  course: Record<string, unknown>
  lessons: Lesson[]
  test: TestWithQuestions | null
}

const TABS = [
  { id: 'general',  label: 'Umumiy',   icon: Info },
  { id: 'lessons',  label: 'Darslar',  icon: BookOpen },
  { id: 'test',     label: 'Test',     icon: ClipboardList },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
]

export function CourseEditor({ course, lessons, test }: Props) {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="bg-white rounded-t-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all relative whitespace-nowrap"
                style={{ color: active ? '#0B3D91' : '#6b7280' }}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                    style={{ backgroundColor: '#0B3D91' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 shadow-sm p-6">
        {activeTab === 'general' && (
          <div className="max-w-2xl">
            <CourseFormInline course={course} />
          </div>
        )}
        {activeTab === 'lessons' && (
          <LessonsTab courseId={course.id as string} initialLessons={lessons} />
        )}
        {activeTab === 'test' && (
          <TestTab courseId={course.id as string} initialTest={test} />
        )}
        {activeTab === 'feedback' && (
          <FeedbackTab courseId={course.id as string} />
        )}
      </div>
    </div>
  )
}

// CourseForm adapted for inline editing (stays on the same page after save)
function CourseFormInline({ course }: { course: Record<string, unknown> }) {
  // After save, reload the current page to refresh course data
  function handleSaved() {
    window.location.reload()
  }
  return <CourseForm course={course} onSaved={handleSaved} />
}
