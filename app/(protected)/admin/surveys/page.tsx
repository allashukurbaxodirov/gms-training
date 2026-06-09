import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import sql from '@/lib/db'
import { SurveysAdmin } from './SurveysAdmin'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function AdminSurveysPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  let surveys: Record<string, unknown>[] = []
  try {
    const rows = await sql`
      SELECT s.id, s.title, s.is_active, s."createdAt",
             c.title AS course_title,
             COUNT(sr.id)::int AS response_count,
             jsonb_array_length(COALESCE(s.questions::jsonb, '[]'::jsonb)) AS question_count
      FROM surveys s
      LEFT JOIN courses c ON c.id = s.course_id
      LEFT JOIN survey_responses sr ON sr.survey_id = s.id
      GROUP BY s.id, c.title
      ORDER BY s."createdAt" DESC
    `
    surveys = rows as unknown as Record<string, unknown>[]
  } catch {}

  return (
    <PageLayout
      title="So'rovnomalar"
      description={`Jami: ${surveys.length} ta so'rovnoma`}
    >
      <SurveysAdmin surveys={surveys} />
    </PageLayout>
  )
}
