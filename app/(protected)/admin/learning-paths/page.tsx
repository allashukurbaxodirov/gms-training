import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { getAllLearningPaths } from '@/lib/queries/learning-paths'
import { LearningPathsAdmin } from './LearningPathsAdmin'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function AdminLearningPathsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  let paths: Record<string, unknown>[] = []
  try {
    paths = (await getAllLearningPaths()) as unknown as Record<string, unknown>[]
  } catch {}

  return (
    <PageLayout
      title="O'quv rejalari"
      description={`Jami: ${paths.length} ta reja`}
      action={<LearningPathsAdmin paths={paths} showAddButton />}
    >
      <LearningPathsAdmin paths={paths} tableOnly />
    </PageLayout>
  )
}
