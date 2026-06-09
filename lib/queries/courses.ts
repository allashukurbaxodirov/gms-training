import sql from '@/lib/db'

export interface CourseFilters {
  page?: number
  limit?: number
  search?: string
  difficulty?: string
  is_published?: boolean
  user_id?: string
  category?: string
}

export async function listCourses(filters: CourseFilters = {}) {
  const { page = 1, limit = 20, search, difficulty, is_published, category } = filters
  const offset = (page - 1) * limit

  // category: "Safety & Environment" and "Safety&Environment" both match
  const categoryFilter = category
    ? category === 'Safety & Environment'
      ? ['Safety & Environment', 'Safety&Environment']
      : [category]
    : null

  const rows = await sql`
    SELECT c.id, c.title, c.description, c.thumbnail_url, c.category,
           c.difficulty, c.duration_minutes, c.is_published, c.is_mandatory,
           c.passing_score, c."createdAt" as created_at,
           u.full_name as creator_name,
           COUNT(DISTINCT e.id)::int as enrollment_count
    FROM courses c
    LEFT JOIN users u ON u.id = c.created_by
    LEFT JOIN enrollments e ON e.course_id = c.id
    WHERE (${search ?? null}::text IS NULL OR c.title ILIKE ${'%' + (search ?? '') + '%'})
      AND (${difficulty ?? null}::text IS NULL OR c.difficulty = ${difficulty ?? null})
      AND (${is_published ?? null}::boolean IS NULL OR c.is_published = ${is_published ?? null})
      AND (${categoryFilter ?? null}::text[] IS NULL OR c.category = ANY(${categoryFilter ?? []}::text[]))
    GROUP BY c.id, u.full_name
    ORDER BY c.category ASC, c.title ASC
    LIMIT ${limit} OFFSET ${offset}
  `

  const [{ count }] = await sql<[{ count: string }]>`
    SELECT COUNT(*)::text FROM courses c
    WHERE (${search ?? null}::text IS NULL OR c.title ILIKE ${'%' + (search ?? '') + '%'})
      AND (${difficulty ?? null}::text IS NULL OR c.difficulty = ${difficulty ?? null})
      AND (${is_published ?? null}::boolean IS NULL OR c.is_published = ${is_published ?? null})
      AND (${categoryFilter ?? null}::text[] IS NULL OR c.category = ANY(${categoryFilter ?? []}::text[]))
  `

  return { rows, total: parseInt(count), page, limit }
}

export async function getCourseById(id: string, userId?: string) {
  const [course] = await sql`
    SELECT c.*,
           u.full_name as creator_name,
           e.id as enrollment_id,
           e.status as enrollment_status,
           e.progress_percent
    FROM courses c
    LEFT JOIN users u ON u.id = c.created_by
    LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = ${userId ?? null}::uuid
    WHERE c.id = ${id}
    LIMIT 1
  `
  if (!course) return null

  const lessons = await sql`
    SELECT id, title, content_type, content_url, content_text,
           duration_minutes, order_index, is_required, xp_reward
    FROM lessons WHERE course_id = ${id} ORDER BY order_index ASC
  `

  const tests = await sql`
    SELECT id, title, time_limit_minutes, passing_score, max_attempts, shuffle_questions
    FROM tests WHERE course_id = ${id}
  `

  // Har bir test uchun savollarni ham yuklash
  const testsWithQuestions = await Promise.all(
    tests.map(async (test) => {
      const questions = await sql`
        SELECT id, text, type, options, correct_text, points, explanation, order_index
        FROM questions WHERE test_id = ${test.id}
        ORDER BY order_index ASC NULLS LAST, "createdAt" ASC
      `
      return {
        ...test,
        questions: questions.map(q => ({
          ...q,
          options: typeof q.options === 'string'
            ? JSON.parse(q.options)
            : (Array.isArray(q.options) ? q.options : []),
        })),
      }
    })
  )

  return { ...course, lessons, tests: testsWithQuestions }
}

export async function createCourse(data: {
  title: string
  description?: string
  category?: string
  difficulty: string
  duration_minutes?: number
  is_mandatory?: boolean
  passing_score?: number
  created_by: string
  department_id?: string
}) {
  const [course] = await sql`
    INSERT INTO courses (id, title, description, category, difficulty, duration_minutes,
                         is_mandatory, passing_score, created_by, department_id, is_published,
                         "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${data.title}, ${data.description ?? null}, ${data.category ?? null},
            ${data.difficulty}, ${data.duration_minutes ?? null},
            ${data.is_mandatory ?? false}, ${data.passing_score ?? 70},
            ${data.created_by}::uuid, ${data.department_id ?? null}::uuid, false,
            NOW(), NOW())
    RETURNING *
  `
  return course
}

export async function getMyCourses(userId: string) {
  return await sql`
    SELECT c.id, c.title, c.thumbnail_url, c.difficulty, c.duration_minutes,
           c.category, c.is_mandatory,
           e.id as enrollment_id, e.status, e.progress_percent,
           e.started_at, e.completed_at, e.planned_date, e.deadline
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.user_id = ${userId}::uuid
    ORDER BY e."createdAt" DESC
  `
}

export async function getMyJits(userId: string) {
  return await sql`
    SELECT
      c.id as course_id,
      c.title,
      c.difficulty,
      e.id as enrollment_id,
      e.training_status,
      e.planned_date,
      e.delivered_date,
      e.tested_date,
      e.can_teach_date,
      e.trainer_id,
      t.full_name as trainer_name
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    LEFT JOIN users t ON t.id = e.trainer_id
    WHERE e.user_id = ${userId}::uuid
      AND e.training_status IS NOT NULL
    ORDER BY e.created_at DESC
  `
}

export async function updateCourse(id: string, data: {
  title?: string
  description?: string
  difficulty?: string
  duration_minutes?: number
  is_mandatory?: boolean
  passing_score?: number
  is_published?: boolean
  category?: string
}) {
  const [course] = await sql`
    UPDATE courses SET
      title = COALESCE(${data.title ?? null}, title),
      description = COALESCE(${data.description ?? null}, description),
      difficulty = COALESCE(${data.difficulty ?? null}, difficulty),
      duration_minutes = COALESCE(${data.duration_minutes ?? null}, duration_minutes),
      is_mandatory = COALESCE(${data.is_mandatory ?? null}, is_mandatory),
      passing_score = COALESCE(${data.passing_score ?? null}, passing_score),
      is_published = COALESCE(${data.is_published ?? null}, is_published),
      category = COALESCE(${data.category ?? null}, category),
      "updatedAt" = NOW()
    WHERE id = ${id}::uuid
    RETURNING *
  `
  return course ?? null
}

// ─────────────────────────────────────────────
// LESSONS
// ─────────────────────────────────────────────

export interface Lesson {
  id: string
  course_id: string
  title: string
  content_type: string
  content_url: string | null
  content_text: string | null
  duration_minutes: number | null
  order_index: number
  is_required: boolean
  xp_reward: number
}

export async function getLessons(courseId: string): Promise<Lesson[]> {
  return await sql<Lesson[]>`
    SELECT id, course_id, title, content_type, content_url, content_text,
           duration_minutes, order_index, is_required, xp_reward
    FROM lessons WHERE course_id = ${courseId}::uuid ORDER BY order_index ASC
  `
}

export async function createLesson(courseId: string, data: {
  title: string
  content_type: string
  content_url?: string | null
  content_text?: string | null
  duration_minutes?: number | null
  xp_reward?: number
  is_required?: boolean
}): Promise<Lesson> {
  const [{ next_order }] = await sql<[{ next_order: number }]>`
    SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order
    FROM lessons WHERE course_id = ${courseId}::uuid
  `
  const [lesson] = await sql<Lesson[]>`
    INSERT INTO lessons (id, course_id, title, content_type, content_url, content_text,
                         duration_minutes, order_index, is_required, xp_reward,
                         "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${courseId}::uuid, ${data.title}, ${data.content_type},
            ${data.content_url ?? null}, ${data.content_text ?? null},
            ${data.duration_minutes ?? null}, ${next_order},
            ${data.is_required ?? true}, ${data.xp_reward ?? 10},
            NOW(), NOW())
    RETURNING id, course_id, title, content_type, content_url, content_text,
              duration_minutes, order_index, is_required, xp_reward
  `
  return lesson
}

export async function updateLesson(lessonId: string, data: {
  title?: string
  content_type?: string
  content_url?: string | null
  content_text?: string | null
  duration_minutes?: number | null
  xp_reward?: number
  is_required?: boolean
}): Promise<void> {
  await sql`
    UPDATE lessons SET
      title = COALESCE(${data.title ?? null}, title),
      content_type = COALESCE(${data.content_type ?? null}, content_type),
      content_url = CASE WHEN ${data.content_url !== undefined} THEN ${data.content_url ?? null} ELSE content_url END,
      content_text = CASE WHEN ${data.content_text !== undefined} THEN ${data.content_text ?? null} ELSE content_text END,
      duration_minutes = COALESCE(${data.duration_minutes ?? null}, duration_minutes),
      xp_reward = COALESCE(${data.xp_reward ?? null}, xp_reward),
      is_required = COALESCE(${data.is_required ?? null}, is_required),
      "updatedAt" = NOW()
    WHERE id = ${lessonId}::uuid
  `
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await sql`DELETE FROM lessons WHERE id = ${lessonId}::uuid`
}

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

export interface Test {
  id: string
  course_id: string
  title: string
  description: string | null
  time_limit_minutes: number | null
  passing_score: number
  max_attempts: number
  shuffle_questions: boolean
  xp_reward: number
}

export async function getTestByCourse(courseId: string): Promise<Test | null> {
  const [test] = await sql<Test[]>`
    SELECT id, course_id, title, description, time_limit_minutes, passing_score,
           max_attempts, shuffle_questions, xp_reward
    FROM tests WHERE course_id = ${courseId}::uuid LIMIT 1
  `
  return test ?? null
}

export async function upsertTest(courseId: string, data: {
  title: string
  description?: string | null
  time_limit_minutes?: number | null
  passing_score?: number
  max_attempts?: number
  shuffle_questions?: boolean
  xp_reward?: number
}): Promise<Test> {
  const existing = await getTestByCourse(courseId)
  if (existing) {
    const [test] = await sql<Test[]>`
      UPDATE tests SET
        title = ${data.title},
        description = ${data.description ?? null},
        time_limit_minutes = ${data.time_limit_minutes ?? null},
        passing_score = ${data.passing_score ?? 70},
        max_attempts = ${data.max_attempts ?? 3},
        shuffle_questions = ${data.shuffle_questions ?? false},
        xp_reward = ${data.xp_reward ?? 50},
        "updatedAt" = NOW()
      WHERE id = ${existing.id}::uuid
      RETURNING id, course_id, title, description, time_limit_minutes, passing_score,
                max_attempts, shuffle_questions, xp_reward
    `
    return test
  } else {
    const [test] = await sql<Test[]>`
      INSERT INTO tests (id, course_id, title, description, time_limit_minutes, passing_score,
                         max_attempts, shuffle_questions, xp_reward, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${courseId}::uuid, ${data.title}, ${data.description ?? null},
              ${data.time_limit_minutes ?? null}, ${data.passing_score ?? 70},
              ${data.max_attempts ?? 3}, ${data.shuffle_questions ?? false}, ${data.xp_reward ?? 50},
              NOW(), NOW())
      RETURNING id, course_id, title, description, time_limit_minutes, passing_score,
                max_attempts, shuffle_questions, xp_reward
    `
    return test
  }
}

// ─────────────────────────────────────────────
// QUESTIONS
// ─────────────────────────────────────────────

export interface QuestionOption {
  text: string
  is_correct: boolean
}

export interface Question {
  id: string
  test_id: string
  text: string
  type: string
  options: QuestionOption[]
  correct_text: string | null
  points: number
  explanation: string | null
  order_index: number
}

export async function getQuestions(testId: string): Promise<Question[]> {
  const rows = await sql<Question[]>`
    SELECT id, test_id, text, type, options, correct_text, points, explanation, order_index
    FROM questions WHERE test_id = ${testId}::uuid ORDER BY order_index ASC
  `
  // Ensure options is always a parsed array (postgres may return JSONB as string)
  return rows.map(q => ({
    ...q,
    options: Array.isArray(q.options)
      ? q.options
      : (typeof q.options === 'string' ? JSON.parse(q.options) : []),
  }))
}

export async function createQuestion(testId: string, data: {
  text: string
  type: string
  options?: QuestionOption[]
  correct_text?: string | null
  points?: number
  explanation?: string | null
}): Promise<Question> {
  const [{ next_order }] = await sql<[{ next_order: number }]>`
    SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order
    FROM questions WHERE test_id = ${testId}::uuid
  `
  const optionsJson = JSON.stringify(data.options ?? [])
  const [q] = await sql<Question[]>`
    INSERT INTO questions (id, test_id, text, type, options, correct_text, points, explanation,
                           order_index, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${testId}::uuid, ${data.text}, ${data.type},
            ${optionsJson}::jsonb, ${data.correct_text ?? null},
            ${data.points ?? 1}, ${data.explanation ?? null}, ${next_order},
            NOW(), NOW())
    RETURNING id, test_id, text, type, options, correct_text, points, explanation, order_index
  `
  return q
}

export async function updateQuestion(questionId: string, data: {
  text?: string
  type?: string
  options?: QuestionOption[]
  correct_text?: string | null
  points?: number
  explanation?: string | null
}): Promise<void> {
  const optionsJson = data.options !== undefined ? JSON.stringify(data.options) : null
  await sql`
    UPDATE questions SET
      text = COALESCE(${data.text ?? null}, text),
      type = COALESCE(${data.type ?? null}, type),
      options = CASE WHEN ${optionsJson} IS NOT NULL THEN ${optionsJson}::jsonb ELSE options END,
      correct_text = CASE WHEN ${data.correct_text !== undefined} THEN ${data.correct_text ?? null} ELSE correct_text END,
      points = COALESCE(${data.points ?? null}, points),
      explanation = CASE WHEN ${data.explanation !== undefined} THEN ${data.explanation ?? null} ELSE explanation END,
      "updatedAt" = NOW()
    WHERE id = ${questionId}::uuid
  `
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await sql`DELETE FROM questions WHERE id = ${questionId}::uuid`
}

// ─────────────────────────────────────────────
// ENROLLMENT WIZARD
// ─────────────────────────────────────────────

export async function getUsersBySubdivisions(
  subdivisionIds: string[],
  shiftIds: string[]
): Promise<{ id: string }[]> {
  if (subdivisionIds.length === 0 && shiftIds.length === 0) {
    return await sql<{ id: string }[]>`
      SELECT id FROM users
      WHERE is_active = true
        AND role NOT IN ('admin', 'super_admin', 'hr', 'o_qituvchi')
    `
  }
  if (subdivisionIds.length > 0 && shiftIds.length > 0) {
    return await sql<{ id: string }[]>`
      SELECT id FROM users
      WHERE is_active = true
        AND role NOT IN ('admin', 'super_admin', 'hr', 'o_qituvchi')
        AND subdivision_id = ANY(${subdivisionIds}::uuid[])
        AND shift_id = ANY(${shiftIds}::uuid[])
    `
  }
  if (subdivisionIds.length > 0) {
    return await sql<{ id: string }[]>`
      SELECT id FROM users
      WHERE is_active = true
        AND role NOT IN ('admin', 'super_admin', 'hr', 'o_qituvchi')
        AND subdivision_id = ANY(${subdivisionIds}::uuid[])
    `
  }
  return await sql<{ id: string }[]>`
    SELECT id FROM users
    WHERE is_active = true
      AND role NOT IN ('admin', 'super_admin', 'hr', 'o_qituvchi')
      AND shift_id = ANY(${shiftIds}::uuid[])
  `
}

export async function bulkEnroll(
  courseId: string,
  userIds: string[],
  meta: {
    planned_date?: string | null
    deadline?: string | null
    trainer_id?: string | null
    assigned_by: string
    is_mandatory?: boolean
    course_title?: string
  }
): Promise<number> {
  if (userIds.length === 0) return 0

  // Get course title for notification if not provided
  let courseTitle = meta.course_title ?? ''
  if (!courseTitle) {
    const [c] = await sql<[{ title: string }]>`SELECT title FROM courses WHERE id = ${courseId}::uuid`
    courseTitle = c?.title ?? 'Yangi kurs'
  }

  // Get existing enrollments for this course
  const existing = await sql<{ user_id: string }[]>`
    SELECT user_id FROM enrollments
    WHERE course_id = ${courseId}::uuid
      AND user_id = ANY(${userIds}::uuid[])
  `
  const existingSet = new Set(existing.map(e => e.user_id))
  const toInsert = userIds.filter(id => !existingSet.has(id))

  if (toInsert.length === 0) return 0

  let inserted = 0
  for (const userId of toInsert) {
    await sql`
      INSERT INTO enrollments (id, user_id, course_id, status, planned_date, deadline, trainer_id, assigned_by,
                               "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${userId}::uuid, ${courseId}::uuid, 'assigned',
              ${meta.planned_date ?? null}::date, ${meta.deadline ?? null}::date,
              ${meta.trainer_id ?? null}::uuid, ${meta.assigned_by}::uuid,
              NOW(), NOW())
    `
    // Send notification to enrolled user
    await sql`
      INSERT INTO notifications (id, user_id, title, message, type, action_url, data,
                                 is_read, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${userId}::uuid,
              'Yangi kurs tayinlandi 📚',
              ${`"${courseTitle}" kursi sizga tayinlandi. Boshlash uchun "Mening kurslarim" bo'limiga o'ting.`},
              'course',
              ${`/my-courses/${courseId}`},
              ${JSON.stringify({ course_id: courseId, course_title: courseTitle, planned_date: meta.planned_date ?? null })}::jsonb,
              false, NOW(), NOW())
    `
    inserted++
  }
  return inserted
}

// ─────────────────────────────────────────────
// SUBDIVISIONS & SHIFTS (for wizard)
// ─────────────────────────────────────────────

export async function getSubdivisions() {
  return await sql`SELECT id, code, name FROM subdivisions WHERE is_active = true ORDER BY code ASC`
}

export async function getShifts() {
  return await sql`SELECT id, code, name FROM shifts ORDER BY code ASC`
}

export async function getTrainers() {
  return await sql`
    SELECT id, full_name, tab_number FROM users
    WHERE role = 'o_qituvchi' AND is_active = true
    ORDER BY full_name ASC
  `
}
