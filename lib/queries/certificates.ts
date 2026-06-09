import sql from '@/lib/db'

export async function getMyCertificates(userId: string) {
  const rows = await sql`
    SELECT
      e.id as enrollment_id,
      e.score,
      e.completed_at,
      c.id as course_id,
      c.title,
      c.difficulty,
      c.duration_minutes,
      c.passing_score,
      c.thumbnail_url
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.user_id = ${userId}::uuid
      AND e.status = 'completed'
    ORDER BY e.completed_at DESC
  `
  return rows
}
