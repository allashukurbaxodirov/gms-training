import sql from '@/lib/db'

export async function getNotifications(userId: string, limit = 20) {
  return await sql`
    SELECT id, type, title, message, is_read, action_url, data, "createdAt" as created_at
    FROM notifications
    WHERE user_id = ${userId}::uuid
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [{ count }] = await sql<[{ count: string }]>`
    SELECT COUNT(*)::text FROM notifications
    WHERE user_id = ${userId}::uuid AND is_read = false
  `
  return parseInt(count)
}

export async function createNotification(data: {
  user_id: string
  title: string
  message: string
  type?: string
  action_url?: string
  extra_data?: Record<string, unknown>
}) {
  await sql`
    INSERT INTO notifications (id, user_id, title, message, type, action_url, data,
                               is_read, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${data.user_id}::uuid, ${data.title}, ${data.message},
            ${data.type ?? 'info'}, ${data.action_url ?? null},
            ${data.extra_data ? JSON.stringify(data.extra_data) : null}::jsonb,
            false, NOW(), NOW())
  `
}

export async function markAsRead(id: string, userId: string) {
  await sql`
    UPDATE notifications SET is_read = true, read_at = NOW(), "updatedAt" = NOW()
    WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
  `
}

export async function markAllAsRead(userId: string) {
  await sql`
    UPDATE notifications SET is_read = true, read_at = NOW(), "updatedAt" = NOW()
    WHERE user_id = ${userId}::uuid AND is_read = false
  `
}
