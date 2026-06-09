import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import sql from '@/lib/db'
import { LiveSessionsAdmin } from './LiveSessionsAdmin'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function AdminLiveSessionsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  let sessions: Record<string, unknown>[] = []
  let courses: Record<string, unknown>[] = []
  let trainers: Record<string, unknown>[] = []
  try {
    const [s, c, t] = await Promise.all([
      sql`
        SELECT ls.id, ls.title, ls.description, ls.session_type, ls.meeting_url, ls.location,
               ls.scheduled_at, ls.duration_minutes, ls.max_participants, ls.is_cancelled,
               u.full_name AS trainer_name, co.title AS course_title
        FROM live_sessions ls
        LEFT JOIN users u ON u.id = ls.trainer_id
        LEFT JOIN courses co ON co.id = ls.course_id
        ORDER BY ls.scheduled_at DESC NULLS LAST
      `,
      sql`SELECT id, title FROM courses WHERE is_published = true ORDER BY title`,
      sql`SELECT id, full_name FROM users WHERE role IN ('o_qituvchi','hr','admin','super_admin') AND is_active = true ORDER BY full_name`,
    ])
    sessions = s as unknown as Record<string, unknown>[]
    courses = c as unknown as Record<string, unknown>[]
    trainers = t as unknown as Record<string, unknown>[]
  } catch {}

  return (
    <PageLayout
      title="Jonli sessiyalar"
      description={`Jami: ${sessions.length} ta sessiya`}
      action={<LiveSessionsAdmin sessions={sessions} courses={courses} trainers={trainers} showAddButton />}
    >
      <LiveSessionsAdmin sessions={sessions} courses={courses} trainers={trainers} tableOnly />
    </PageLayout>
  )
}
