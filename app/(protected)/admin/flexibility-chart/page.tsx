import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import sql from '@/lib/db'
import { FlexibilityChart } from './FlexibilityChart'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function AdminFlexibilityPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  let skillMatrix: Record<string, unknown>[] = []
  let workstations: Record<string, unknown>[] = []
  let users: Record<string, unknown>[] = []
  let shops: Record<string, unknown>[] = []
  try {
    const [sm, w, u, s] = await Promise.all([
      sql`
        SELECT sm.user_id, sm.workstation_id, sm.level, sm.level_numeric, sm.can_backup
        FROM skill_matrix sm
      `,
      sql`
        SELECT w.id, w.code, w.name, sd.name AS subdivision_name
        FROM workstations w
        LEFT JOIN subdivisions sd ON sd.id = w.subdivision_id
        WHERE w.is_active = true
        ORDER BY w.order_index, w.name
      `,
      sql`
        SELECT u.id, u.full_name, u.tab_number, u.job_title, u.shop_id, sh.name AS shop_name
        FROM users u
        LEFT JOIN shops sh ON sh.id = u.shop_id
        WHERE u.is_active = true AND u.role NOT IN ('super_admin','admin','hr')
        ORDER BY sh.name NULLS LAST, u.full_name
      `,
      sql`SELECT id, name FROM shops ORDER BY name`,
    ])
    skillMatrix = sm as unknown as Record<string, unknown>[]
    workstations = w as unknown as Record<string, unknown>[]
    users = u as unknown as Record<string, unknown>[]
    shops = s as unknown as Record<string, unknown>[]
  } catch {}

  return (
    <PageLayout
      title="Moslashuvchanlik jadvali"
      description={`Xodimlarning ish joylaridagi malaka darajalari · ${users.length} xodim · ${workstations.length} ish joyi`}
    >
      <FlexibilityChart
        skillMatrix={skillMatrix}
        workstations={workstations}
        users={users}
        shops={shops}
      />
    </PageLayout>
  )
}
