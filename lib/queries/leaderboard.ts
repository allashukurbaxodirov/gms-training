import sql from '@/lib/db'

export async function getLeaderboard(limit = 50) {
  const rows = await sql`
    SELECT
      u.id,
      u.full_name,
      u.xp_points,
      u.level,
      u.streak_days,
      u.avatar_url,
      s.name as shop_name,
      RANK() OVER (ORDER BY u.xp_points DESC) as rank
    FROM users u
    LEFT JOIN shops s ON s.id = u.shop_id
    WHERE u.is_active = true
    ORDER BY u.xp_points DESC
    LIMIT ${limit}
  `
  return rows
}
