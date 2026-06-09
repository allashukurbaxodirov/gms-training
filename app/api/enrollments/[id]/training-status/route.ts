import { NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { getEnrollment, updateTrainingStatus } from '@/lib/queries/enrollments'
import { TRAINER_ROLES, ADMIN_ROLES } from '@/constants/roles'

// PATCH /api/enrollments/[id]/training-status — trainer/admin only
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const allowed = requireRole(session, [...TRAINER_ROLES, ...ADMIN_ROLES])
  if (!allowed) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })

  const { id } = await params
  const enrollment = await getEnrollment(id)
  if (!enrollment) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })

  const { status, date } = await request.json()
  const validStatuses = ['planned', 'delivered', 'tested', 'can_teach']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Noto\'g\'ri status' }, { status: 400 })
  }

  await updateTrainingStatus(id, status, date ?? new Date().toISOString().split('T')[0])
  return NextResponse.json({ ok: true })
}
