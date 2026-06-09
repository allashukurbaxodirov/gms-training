import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { getTrainingMatrixData } from '@/lib/queries/training-matrix'
import { TrainingMatrix } from './TrainingMatrix'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function TrainingMatrixPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  type MatrixData = { courses: Record<string, unknown>[]; users: Record<string, unknown>[]; enrollments: Record<string, unknown>[] }
  let data: MatrixData = { courses: [], users: [], enrollments: [] }
  try {
    data = await getTrainingMatrixData() as unknown as MatrixData
  } catch {}

  return (
    <PageLayout
      title="Trening matritsa"
      description={`Xodimlarni o'qitish grafigi · ${data.users.length} xodim · ${data.courses.length} kurs`}
      action={
        <button
          onClick={undefined}
          id="export-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          📥 Excel yuklab olish
        </button>
      }
    >
      <TrainingMatrix
        courses={data.courses as Record<string, unknown>[]}
        users={data.users as Record<string, unknown>[]}
        enrollments={data.enrollments as Record<string, unknown>[]}
      />
    </PageLayout>
  )
}
