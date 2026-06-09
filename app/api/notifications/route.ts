import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getNotifications, getUnreadCount, markAllAsRead } from '@/lib/queries/notifications'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const countOnly = searchParams.get('count') === 'true'

  if (countOnly) {
    const count = await getUnreadCount(session.id)
    return NextResponse.json({ count })
  }

  const notifications = await getNotifications(session.id)
  return NextResponse.json(notifications)
}

export async function PATCH() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await markAllAsRead(session.id)
  return NextResponse.json({ ok: true })
}
