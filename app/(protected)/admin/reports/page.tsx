import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { ReportsView } from './ReportsView'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function AdminReportsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  return (
    <PageLayout
      title="Hisobotlar"
      description="Kurs va xodim jarayonlari bo'yicha hisobotlar"
    >
      <ReportsView />
    </PageLayout>
  )
}
