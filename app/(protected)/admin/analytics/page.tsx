import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import {
  getEnrollmentsByMonth,
  getTopCourses,
  getActiveUsersByWeek,
  getSummaryStats,
} from '@/lib/queries/analytics'
import { AnalyticsCharts } from './AnalyticsCharts'
import { BarChart2, UsersRound, Library, Medal, PlayCircle } from 'lucide-react'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function AdminAnalyticsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  let enrollByMonth: Record<string, unknown>[] = []
  let topCourses: Record<string, unknown>[] = []
  let activeByWeek: Record<string, unknown>[] = []
  let stats: Record<string, unknown> = {}

  try {
    ;[enrollByMonth, topCourses, activeByWeek, stats] = await Promise.all([
      getEnrollmentsByMonth() as Promise<Record<string, unknown>[]>,
      getTopCourses(10) as Promise<Record<string, unknown>[]>,
      getActiveUsersByWeek() as Promise<Record<string, unknown>[]>,
      getSummaryStats() as Promise<Record<string, unknown>>,
    ])
  } catch {}

  return (
    <PageLayout
      title="Analitika"
      description="Platform faolligi va o'quv statistikasi"
    >

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: <UsersRound className="h-5 w-5" />, label: 'Faol xodimlar', value: stats.total_users ?? 0, color: '#0B3D91' },
          { icon: <Library className="h-5 w-5" />, label: 'Nashr kurslar', value: stats.published_courses ?? 0, color: '#0B3D91' },
          { icon: <Medal className="h-5 w-5" />, label: 'Tugatilgan', value: stats.total_completions ?? 0, color: '#10b981' },
          { icon: <PlayCircle className="h-5 w-5" />, label: 'Jarayonda', value: stats.in_progress ?? 0, color: '#f59e0b' },
          { icon: <BarChart2 className="h-5 w-5" />, label: 'O\'rt. progress', value: `${stats.avg_progress ?? 0}%`, color: '#6b7280' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div style={{ color: s.color }}>{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value as string | number}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AnalyticsCharts
        enrollByMonth={enrollByMonth}
        topCourses={topCourses}
        activeByWeek={activeByWeek}
      />
    </PageLayout>
  )
}
