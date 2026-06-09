import { getSession } from '@/lib/auth'
import { getLearningPlan } from '@/lib/queries/learning-plan'
import { LearningPlanView } from './LearningPlanView'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function LearningPlanPage() {
  const session = await getSession()
  if (!session) return null

  let courses: Record<string, unknown>[] = []
  try {
    courses = (await getLearningPlan(session.id)) as Record<string, unknown>[]
  } catch (e) {
    console.error('getLearningPlan error:', e)
  }

  return (
    <PageLayout
      title="O'quv rejasi"
      description="GMS Functional, GM-GMS va Safety & Environment bo'yicha barcha o'quv kurslari"
    >
      <LearningPlanView courses={courses} />
    </PageLayout>
  )
}
