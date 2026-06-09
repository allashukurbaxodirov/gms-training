import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import sql from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }
  try {
    const { id } = await params
    const b = await request.json()
    const [row] = await sql`
      UPDATE surveys SET is_active = ${b.is_active} WHERE id = ${id} RETURNING *
    `
    return NextResponse.json(row)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
