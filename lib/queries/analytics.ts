import sql from '@/lib/db'

export async function getEnrollmentsByMonth() {
  return await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'completed')::int as completed
    FROM enrollments
    WHERE "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY DATE_TRUNC('month', "createdAt") ASC
  `
}

export async function getTopCourses(limit = 10) {
  return await sql`
    SELECT
      c.title,
      COUNT(e.id)::int as enrollments,
      COUNT(e.id) FILTER (WHERE e.status = 'completed')::int as completions,
      ROUND(
        COUNT(e.id) FILTER (WHERE e.status = 'completed') * 100.0
        / NULLIF(COUNT(e.id), 0)
      )::int as completion_rate
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    GROUP BY c.id, c.title
    ORDER BY enrollments DESC
    LIMIT ${limit}
  `
}

export async function getActiveUsersByWeek() {
  return await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('week', last_login), 'YYYY-MM-DD') as week,
      COUNT(*)::int as active_users
    FROM users
    WHERE last_login >= NOW() - INTERVAL '12 weeks'
      AND is_active = true
    GROUP BY DATE_TRUNC('week', last_login)
    ORDER BY DATE_TRUNC('week', last_login) ASC
  `
}

export async function getSummaryStats() {
  const [stats] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE is_active = true) as total_users,
      (SELECT COUNT(*)::int FROM courses WHERE is_published = true) as published_courses,
      (SELECT COUNT(*)::int FROM enrollments WHERE status = 'completed') as total_completions,
      (SELECT COUNT(*)::int FROM enrollments WHERE status = 'in_progress') as in_progress,
      (SELECT ROUND(AVG(progress_percent))::int FROM enrollments WHERE status != 'assigned') as avg_progress
  `
  return stats
}
