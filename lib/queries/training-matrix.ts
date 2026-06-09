import sql from '@/lib/db'

export async function getTrainingMatrixData() {
  // Barcha nashr etilgan kurslar (kategoriya bo'yicha tartiblangan)
  const courses = await sql`
    SELECT id, title, category, difficulty, is_mandatory, scheduled_month
    FROM courses
    WHERE is_published = true
    ORDER BY
      CASE WHEN category = 'Functional'         THEN 1
           WHEN category = 'GM-GMS'             THEN 2
           WHEN category = 'Safety&Environment' THEN 3
           ELSE 4
      END,
      title ASC
  `

  // Barcha faol xodimlar + ularning trainer ma'lumotlari
  const users = await sql`
    SELECT
      u.id,
      u.tab_number,
      u.full_name,
      u.job_title,
      u.shop_id,
      s.name  AS shop_name,
      trainer.full_name AS trainer_name
    FROM users u
    LEFT JOIN shops s      ON s.id = u.shop_id
    LEFT JOIN (
      SELECT DISTINCT e.user_id, u2.full_name
      FROM enrollments e
      JOIN users u2 ON u2.id = e.trainer_id
      WHERE e.trainer_id IS NOT NULL
    ) trainer ON trainer.user_id = u.id
    WHERE u.is_active = true
      AND u.role NOT IN ('super_admin','admin','hr')
    ORDER BY s.name NULLS LAST, u.full_name ASC
  `

  // Barcha enrollmentlar (planned/delivered/tested/completed sanalari)
  const enrollments = await sql`
    SELECT
      e.user_id,
      e.course_id,
      e.status,
      e.training_status,
      e.planned_date,
      e.delivered_date,
      e.tested_date,
      e.can_teach_date,
      e.completed_at,
      e.progress_percent
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE c.is_published = true
  `

  return { courses, users, enrollments }
}
