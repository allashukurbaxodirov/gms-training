import sql from '@/lib/db'

export interface DbUser {
  id: string
  tab_number: string
  login: string
  password_hash: string
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  job_title: string | null
  is_active: boolean
  xp_points: number
  level: number
  streak_days: number
  last_login: string | null
  department_id: string | null
  shop_id: string | null
  subdivision_id: string | null
  created_at: string
}

export async function findUserByLogin(login: string): Promise<DbUser | null> {
  const rows = await sql<DbUser[]>`
    SELECT * FROM users
    WHERE (login = ${login} OR tab_number = ${login})
      AND is_active = true
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const rows = await sql<DbUser[]>`
    SELECT u.*,
      d.name as department_name,
      s.name as shop_name
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN shops s ON s.id = u.shop_id
    WHERE u.id = ${id}
    LIMIT 1
  `
  return rows[0] ?? null
}

export interface UserListFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
  shop_id?: string
  is_active?: boolean
}

export async function listUsers(filters: UserListFilters = {}) {
  const { page = 1, limit = 20, search, role, shop_id, is_active } = filters
  const offset = (page - 1) * limit

  const rows = await sql`
    SELECT u.id, u.tab_number, u.login, u.full_name, u.email, u.role,
           u.job_title, u.is_active, u.xp_points, u.level, u.created_at,
           s.name as shop_name, d.name as department_name
    FROM users u
    LEFT JOIN shops s ON s.id = u.shop_id
    LEFT JOIN departments d ON d.id = u.department_id
    WHERE (${search ?? null}::text IS NULL
           OR u.full_name ILIKE ${'%' + (search ?? '') + '%'}
           OR u.tab_number ILIKE ${'%' + (search ?? '') + '%'}
           OR u.login ILIKE ${'%' + (search ?? '') + '%'})
      AND (${role ?? null}::text IS NULL OR u.role = ${role ?? null})
      AND (${shop_id ?? null}::uuid IS NULL OR u.shop_id = ${shop_id ?? null}::uuid)
      AND (${is_active ?? null}::boolean IS NULL OR u.is_active = ${is_active ?? null})
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const [{ count }] = await sql<[{ count: string }]>`
    SELECT COUNT(*)::text FROM users u
    WHERE (${search ?? null}::text IS NULL
           OR u.full_name ILIKE ${'%' + (search ?? '') + '%'}
           OR u.tab_number ILIKE ${'%' + (search ?? '') + '%'})
      AND (${role ?? null}::text IS NULL OR u.role = ${role ?? null})
      AND (${shop_id ?? null}::uuid IS NULL OR u.shop_id = ${shop_id ?? null}::uuid)
      AND (${is_active ?? null}::boolean IS NULL OR u.is_active = ${is_active ?? null})
  `

  return { rows, total: parseInt(count), page, limit }
}

export async function updateUserLastLogin(id: string) {
  await sql`
    UPDATE users SET last_login = NOW(),
      streak_days = CASE
        WHEN last_activity_date = CURRENT_DATE - 1 THEN streak_days + 1
        WHEN last_activity_date = CURRENT_DATE THEN streak_days
        ELSE 1
      END,
      last_activity_date = CURRENT_DATE
    WHERE id = ${id}
  `
}

export async function updateUserProfile(id: string, data: { phone?: string; avatar_url?: string; language?: string }) {
  const [user] = await sql`
    UPDATE users SET
      phone = COALESCE(${data.phone ?? null}, phone),
      avatar_url = COALESCE(${data.avatar_url ?? null}, avatar_url),
      language = COALESCE(${data.language ?? null}, language),
      "updatedAt" = NOW()
    WHERE id = ${id}
    RETURNING id, full_name, login, role, tab_number, avatar_url, xp_points, level, phone, language
  `
  return user
}
