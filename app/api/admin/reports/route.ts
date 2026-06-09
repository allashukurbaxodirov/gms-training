import { NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import sql from '@/lib/db'

export async function GET(request: Request) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const status = searchParams.get('status')

  const rows = await sql`
    SELECT
      u.full_name,
      u.tab_number,
      c.title as course_title,
      e.status,
      e.progress_percent,
      e.score,
      e.started_at,
      e.completed_at
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    JOIN courses c ON c.id = e.course_id
    WHERE (${search ?? null}::text IS NULL
           OR u.full_name ILIKE ${'%' + (search ?? '') + '%'}
           OR c.title ILIKE ${'%' + (search ?? '') + '%'}
           OR u.tab_number ILIKE ${'%' + (search ?? '') + '%'})
      AND (${status ?? null}::text IS NULL OR e.status = ${status ?? null})
    ORDER BY u.full_name ASC, c.title ASC
    LIMIT 500
  `

  return NextResponse.json({ rows })
}
