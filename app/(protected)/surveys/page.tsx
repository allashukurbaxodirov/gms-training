import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { ListChecks, CheckCircle2, HelpCircle } from 'lucide-react'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function SurveysPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  let surveys: Record<string, unknown>[] = []
  let myResponses: Set<string> = new Set()
  try {
    const [s, r] = await Promise.all([
      sql`
        SELECT s.id, s.title, s.is_active, s."createdAt",
               c.title AS course_title,
               jsonb_array_length(COALESCE(s.questions::jsonb, '[]'::jsonb)) AS question_count
        FROM surveys s
        LEFT JOIN courses c ON c.id = s.course_id
        WHERE s.is_active = true
        ORDER BY s."createdAt" DESC
      `,
      sql`
        SELECT survey_id FROM survey_responses WHERE user_id = ${session.id}
      `,
    ])
    surveys = s as unknown as Record<string, unknown>[]
    myResponses = new Set((r as unknown as { survey_id: string }[]).map((x) => x.survey_id))
  } catch {}

  const pending = surveys.filter((s) => !myResponses.has(s.id as string))
  const completed = surveys.filter((s) => myResponses.has(s.id as string))

  return (
    <PageLayout
      title="So'rovnomalar"
      description="Trening va kurslar haqida fikringizni bildiring"
    >

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Jami so\'rovnoma', value: surveys.length, color: '#0B3D91', icon: ListChecks },
          { label: 'Kutilmoqda', value: pending.length, color: '#d97706', icon: HelpCircle },
          { label: 'Bajarildi', value: completed.length, color: '#16a34a', icon: CheckCircle2 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}>
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending surveys */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Kutilayotgan so&apos;rovnomalar</h2>
          <div className="grid gap-3">
            {pending.map((s) => (
              <div key={String(s.id)} className="bg-white rounded-xl border border-amber-100 shadow-sm p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <ListChecks className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{String(s.title)}</h3>
                  {s.course_title ? <p className="text-sm text-gray-500 mt-0.5">{String(s.course_title)}</p> : null}
                  <p className="text-xs text-gray-400 mt-1">{String(s.question_count ?? 0)} ta savol</p>
                </div>
                <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0" style={{ backgroundColor: '#FFB81C', color: '#1e3a8a' }}>
                  Boshlash
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-500 mb-3">Bajarilgan so&apos;rovnomalar</h2>
          <div className="grid gap-3">
            {completed.map((s) => (
              <div key={String(s.id)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 opacity-70">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{String(s.title)}</h3>
                  {s.course_title ? <p className="text-sm text-gray-500 mt-0.5">{String(s.course_title)}</p> : null}
                </div>
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Bajarildi
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {surveys.length === 0 && (
        <div className="bg-white rounded-xl border p-16 text-center">
          <ListChecks className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Hozircha so&apos;rovnomalar yo&apos;q</p>
        </div>
      )}
    </PageLayout>
  )
}

