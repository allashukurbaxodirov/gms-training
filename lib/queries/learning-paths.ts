import sql from '@/lib/db'

export interface LearningPath {
  id: string
  title: string
  description: string | null
  is_published: boolean
  level: string | null
  estimated_hours: number
  order_index: number
  target_role: string | null
  course_count: number
  created_at: string
}

export interface LearningPathCourse {
  id: string
  path_id: string
  course_id: string
  order_index: number
  is_required: boolean
  course_title: string
  course_category: string | null
  course_difficulty: string
}

export async function getAllLearningPaths(): Promise<LearningPath[]> {
  const rows = await sql`
    SELECT
      lp.id,
      lp.title,
      lp.description,
      lp.is_published,
      lp.level,
      lp.estimated_hours,
      lp.order_index,
      lp."createdAt" AS created_at,
      COUNT(lpc.id)::int AS course_count
    FROM learning_paths lp
    LEFT JOIN learning_path_courses lpc ON lpc.path_id = lp.id
    GROUP BY lp.id
    ORDER BY lp.order_index, lp."createdAt"
  `
  return rows.map((r) => ({ ...r, target_role: null })) as LearningPath[]
}

export async function getLearningPathById(id: string) {
  const [lp] = await sql`
    SELECT
      lp.id, lp.title, lp.description, lp.is_published,
      lp.level, lp.estimated_hours, lp.order_index, lp."createdAt" AS created_at
    FROM learning_paths lp
    WHERE lp.id = ${id}
  `
  if (!lp) return null

  const courses = await sql`
    SELECT
      lpc.id, lpc.path_id, lpc.course_id, lpc.order_index, lpc.is_required,
      c.title AS course_title, c.category AS course_category, c.difficulty AS course_difficulty
    FROM learning_path_courses lpc
    JOIN courses c ON c.id = lpc.course_id
    WHERE lpc.path_id = ${id}
    ORDER BY lpc.order_index
  `
  return { ...lp, courses }
}

export async function createLearningPath(data: {
  title: string
  description?: string
  is_published?: boolean
  created_by: string
}) {
  const [row] = await sql`
    INSERT INTO learning_paths (title, description, is_published, created_by)
    VALUES (${data.title}, ${data.description ?? null}, ${data.is_published ?? false}, ${data.created_by})
    RETURNING *
  `
  return row
}

export async function updateLearningPath(id: string, data: {
  title?: string
  description?: string
  is_published?: boolean
}) {
  const sets: string[] = []
  if (data.title !== undefined)       sets.push(`title = '${data.title.replace(/'/g, "''")}'`)
  if (data.description !== undefined) sets.push(`description = '${(data.description ?? '').replace(/'/g, "''")}'`)
  if (data.is_published !== undefined) sets.push(`is_published = ${data.is_published}`)

  if (sets.length === 0) return null
  const [row] = await sql`
    UPDATE learning_paths
    SET ${sql.unsafe(sets.join(', '))}
    WHERE id = ${id}
    RETURNING *
  `
  return row
}

export async function toggleLearningPathPublished(id: string, is_published: boolean) {
  const [row] = await sql`
    UPDATE learning_paths SET is_published = ${is_published} WHERE id = ${id} RETURNING *
  `
  return row
}
