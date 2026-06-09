import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getEnrollment, updateEnrollmentProgress } from '@/lib/queries/enrollments'

// PATCH /api/enrollments/[id] — progress yangilash
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const enrollment = await getEnrollment(id)
  if (!enrollment) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })

  // Faqat o'z enrollmentini yangilay oladi
  if (enrollment.user_id !== session.id) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }

  const { progress_percent } = await request.json()
  if (typeof progress_percent !== 'number') {
    return NextResponse.json({ error: 'progress_percent raqam bo\'lishi kerak' }, { status: 400 })
  }

  const percent = Math.min(100, Math.max(0, Math.round(progress_percent)))
  await updateEnrollmentProgress(id, percent)
  return NextResponse.json({ ok: true, progress_percent: percent })
}
