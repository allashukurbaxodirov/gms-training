import sql from '@/lib/db'

export async function getEnrollment(enrollmentId: string) {
  const rows = await sql`
    SELECT e.*, c.passing_score as course_passing_score
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.id = ${enrollmentId}::uuid
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function getEnrollmentByUserCourse(userId: string, courseId: string) {
  const rows = await sql`
    SELECT * FROM enrollments
    WHERE user_id = ${userId}::uuid AND course_id = ${courseId}::uuid
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function updateEnrollmentProgress(enrollmentId: string, percent: number) {
  const status = percent >= 100 ? 'completed' : 'in_progress'
  await sql`
    UPDATE enrollments SET
      progress_percent = ${percent},
      status = ${status},
      started_at = COALESCE(started_at, NOW()),
      completed_at = CASE WHEN ${percent} >= 100 THEN NOW() ELSE completed_at END,
      "updatedAt" = NOW()
    WHERE id = ${enrollmentId}::uuid
  `
}

export async function enrollUser(userId: string, courseId: string, assignedBy?: string) {
  const rows = await sql`
    INSERT INTO enrollments (user_id, course_id, status, assigned_by)
    VALUES (${userId}::uuid, ${courseId}::uuid, 'assigned', ${assignedBy ?? null}::uuid)
    ON CONFLICT (user_id, course_id) DO NOTHING
    RETURNING *
  `
  return rows[0] ?? null
}

export async function updateTrainingStatus(
  enrollmentId: string,
  status: 'planned' | 'delivered' | 'tested' | 'can_teach',
  date: string
) {
  const dateCol = {
    planned: 'planned_date',
    delivered: 'delivered_date',
    tested: 'tested_date',
    can_teach: 'can_teach_date',
  }[status]

  await sql`
    UPDATE enrollments SET
      training_status = ${status},
      ${sql.unsafe(dateCol)} = ${date},
      "updatedAt" = NOW()
    WHERE id = ${enrollmentId}::uuid
  `
}
