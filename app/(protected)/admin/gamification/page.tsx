import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import sql from '@/lib/db'
import { GamificationAdmin } from './GamificationAdmin'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function AdminGamificationPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  let badges: Record<string, unknown>[] = []
  let leaderboard: Record<string, unknown>[] = []
  try {
    const [b, lb] = await Promise.all([
      sql`SELECT b.*, COUNT(ub.id)::int AS earned_count
          FROM badges b LEFT JOIN user_badges ub ON ub.badge_id = b.id
          GROUP BY b.id ORDER BY b."createdAt"`,
      sql`SELECT u.id, u.full_name, u.xp_points, u.level, u.streak_days, s.name AS shop_name,
               COUNT(ub.id)::int AS badge_count
          FROM users u
          LEFT JOIN shops s ON s.id = u.shop_id
          LEFT JOIN user_badges ub ON ub.user_id = u.id
          WHERE u.is_active = true AND u.role NOT IN ('super_admin','admin','hr')
          GROUP BY u.id, s.name
          ORDER BY u.xp_points DESC NULLS LAST
          LIMIT 20`,
    ])
    badges = b as unknown as Record<string, unknown>[]
    leaderboard = lb as unknown as Record<string, unknown>[]
  } catch {}

  return (
    <PageLayout
      title="Geymifikatsiya"
      description="Nishonlar va reyting boshqaruvi"
    >
      <GamificationAdmin badges={badges} leaderboard={leaderboard} />
    </PageLayout>
  )
}
