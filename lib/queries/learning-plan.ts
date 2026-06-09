import sql from '@/lib/db'

export async function getLearningPlan(userId: string) {
  // Barcha nashr etilgan kurslar + foydalanuvchining holati
  const rows = await sql`
    SELECT
      c.id,
      c.title,
      c.description,
      c.category,
      c.difficulty,
      c.duration_minutes,
      c.is_mandatory,
      c.passing_score,
      c.thumbnail_url,
      e.id          AS enrollment_id,
      e.status      AS enrollment_status,
      COALESCE(e.progress_percent, 0) AS progress_percent
    FROM courses c
    LEFT JOIN enrollments e
      ON e.course_id = c.id AND e.user_id = ${userId}::uuid
    WHERE c.is_published = true
    ORDER BY c.is_mandatory DESC, c.category NULLS LAST, c.title ASC
  `
  return rows
}

export async function enrollInCourse(userId: string, courseId: string) {
  const [row] = await sql`
    INSERT INTO enrollments (user_id, course_id, status)
    VALUES (${userId}::uuid, ${courseId}::uuid, 'assigned')
    ON CONFLICT (user_id, course_id) DO NOTHING
    RETURNING id
  `
  return row ?? null
}
