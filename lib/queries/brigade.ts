import sql from '@/lib/db'

export async function getBrigadeEnrollments(trainerId: string) {
  return await sql`
    SELECT
      u.id as user_id,
      u.full_name,
      u.tab_number,
      u.job_title,
      c.id as course_id,
      c.title as course_title,
      c.difficulty,
      e.id as enrollment_id,
      e.training_status,
      e.planned_date,
      e.delivered_date,
      e.tested_date,
      e.can_teach_date,
      e.progress_percent,
      e.status
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    JOIN courses c ON c.id = e.course_id
    WHERE e.trainer_id = ${trainerId}::uuid
      AND e.training_status IS NOT NULL
    ORDER BY u.full_name ASC, c.title ASC
  `
}

export async function getBrigadeMembers(trainerId: string) {
  // Users whose enrollments have this trainer
  return await sql`
    SELECT DISTINCT
      u.id,
      u.full_name,
      u.tab_number,
      u.job_title,
      u.xp_points,
      u.level,
      s.name as shop_name
    FROM users u
    JOIN enrollments e ON e.user_id = u.id
    LEFT JOIN shops s ON s.id = u.shop_id
    WHERE e.trainer_id = ${trainerId}::uuid
      AND u.is_active = true
    ORDER BY u.full_name ASC
  `
}
