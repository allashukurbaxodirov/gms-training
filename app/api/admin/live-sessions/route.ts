import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import sql from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }
  try {
    const rows = await sql`
      SELECT ls.*, u.full_name AS trainer_name, c.title AS course_title
      FROM live_sessions ls
      LEFT JOIN users u ON u.id = ls.trainer_id
      LEFT JOIN courses c ON c.id = ls.course_id
      ORDER BY ls.scheduled_at DESC NULLS LAST
    `
    return NextResponse.json(rows)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }
  try {
    const b = await request.json()
    if (!b.title?.trim()) return NextResponse.json({ error: 'Nomi majburiy' }, { status: 400 })
    const [row] = await sql`
      INSERT INTO live_sessions (title, description, session_type, meeting_url, location, scheduled_at, duration_minutes, max_participants, trainer_id, course_id)
      VALUES (
        ${b.title.trim()},
        ${b.description?.trim() ?? null},
        ${b.session_type ?? 'online'},
        ${b.meeting_url?.trim() ?? null},
        ${b.location?.trim() ?? null},
        ${b.scheduled_at ?? null},
        ${b.duration_minutes ?? 60},
        ${b.max_participants ?? 30},
        ${b.trainer_id ?? null},
        ${b.course_id ?? null}
      )
      RETURNING *
    `
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
