import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getBrigadeEnrollments } from '@/lib/queries/brigade'
import { TRAINER_ROLES, ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { BrigadeJITTable } from './BrigadeJITTable'
import { GraduationCap } from 'lucide-react'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function BrigadeJITPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const role = session.role as Role
  if (![...TRAINER_ROLES, ...ADMIN_ROLES].includes(role)) redirect('/dashboard')

  let enrollments: Record<string, unknown>[] = []
  try {
    enrollments = (await getBrigadeEnrollments(session.id)) as Record<string, unknown>[]
  } catch {}

  return (
    <PageLayout
      title="Brigada JIT boshqaruvi"
      description="Xodimlar JIT training holati"
      action={
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#0B3D91' }}
        >
          <GraduationCap className="h-4 w-4" />
          {enrollments.length} ta yozuv
        </div>
      }
    >
      <BrigadeJITTable enrollments={enrollments} />
    </PageLayout>
  )
}
