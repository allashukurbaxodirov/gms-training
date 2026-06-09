import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUsersBySubdivisions, bulkEnroll } from '@/lib/queries/courses'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

// POST /api/courses/[id]/enroll — bulk enrollment wizard
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const { subdivision_ids = [], shift_ids = [], planned_date, deadline, trainer_id, preview } = body

  try {
    const users = await getUsersBySubdivisions(subdivision_ids, shift_ids)

    // preview mode — just return count
    if (preview) {
      return NextResponse.json({ count: users.length })
    }

    if (users.length === 0) {
      return NextResponse.json({ ok: true, enrolled: 0, message: 'Mos xodimlar topilmadi' })
    }

    const userIds = users.map((u) => u.id)
    const enrolled = await bulkEnroll(id, userIds, {
      planned_date: planned_date ?? null,
      deadline: deadline ?? null,
      trainer_id: trainer_id ?? null,
      assigned_by: session.id,
    })

    return NextResponse.json({ ok: true, enrolled })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
