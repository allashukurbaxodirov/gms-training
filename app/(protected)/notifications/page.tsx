import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getNotifications } from '@/lib/queries/notifications'
import { NotificationsClient } from './NotificationsClient'
import type { NotifItem } from './NotificationsClient'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function NotificationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const notifications = await getNotifications(session.id, 50)

  return (
    <PageLayout title="Bildirishnomalar">
      <div className="max-w-2xl">
        <NotificationsClient initialNotifications={notifications as unknown as NotifItem[]} />
      </div>
    </PageLayout>
  )
}
