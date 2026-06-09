import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { enrollInCourse } from '@/lib/queries/learning-plan'

// POST /api/enrollments — kursga yozilish
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'course_id kerak' }, { status: 400 })

  try {
    const enrollment = await enrollInCourse(session.id, course_id)
    return NextResponse.json({ ok: true, enrollment })
  } catch (error) {
    console.error('Enroll error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
