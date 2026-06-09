import { getSession } from '@/lib/auth'
import { getMyJits } from '@/lib/queries/courses'
import { Zap, CheckCircle, Circle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { PageLayout } from '@/components/ui/PageLayout'

const STAGES = [
  { key: 'planned', label: 'Rejalashtirilgan', color: '#6b7280' },
  { key: 'delivered', label: 'O\'tildi', color: '#3b82f6' },
  { key: 'tested', label: 'Sinovdan o\'tdi', color: '#f59e0b' },
  { key: 'can_teach', label: 'O\'qita oladi', color: '#10b981' },
] as const

type Stage = typeof STAGES[number]['key']

const stageOrder: Record<Stage, number> = { planned: 0, delivered: 1, tested: 2, can_teach: 3 }

export default async function MyJitsPage() {
  const session = await getSession()
  if (!session) return null

  let jits: Record<string, unknown>[] = []
  try {
    jits = (await getMyJits(session.id)) as Record<string, unknown>[]
  } catch {}

  return (
    <PageLayout
      title="JIT Ko'nikmalar"
      description="Job Instruction Training — kasbiy malaka darajalari"
      action={
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#0B3D91' }}
        >
          <Zap className="h-4 w-4" />
          {jits.length} ta kurs
        </div>
      }
    >

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {STAGES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-100 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {jits.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-24 text-center">
          <Zap className="h-14 w-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">JIT jarayonlar yo&apos;q</p>
          <p className="text-sm text-gray-400 mt-1">Murabbiyingiz sizga JIT tayinlaganida bu yerda ko&apos;rinadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jits.map((jit) => {
            const currentStage = jit.training_status as Stage | null
            const stageIdx = currentStage ? stageOrder[currentStage] ?? -1 : -1

            return (
              <div key={jit.enrollment_id as string} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{jit.title as string}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{jit.difficulty as string}</p>
                  </div>
                  {jit.trainer_name ? (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">Murabbiy</p>
                      <p className="text-sm font-medium text-gray-700">{String(jit.trainer_name)}</p>
                    </div>
                  ) : null}
                </div>

                {/* Stages progress */}
                <div className="relative flex items-center gap-0">
                  {STAGES.map((stage, i) => {
                    const done = i <= stageIdx
                    const active = i === stageIdx
                    const dateKey = `${stage.key}_date`
                    const date = jit[dateKey] as string | null

                    return (
                      <div key={stage.key} className="flex-1 flex flex-col items-center gap-1.5">
                        {/* Connector line */}
                        <div className="relative w-full flex items-center justify-center">
                          {i > 0 && (
                            <div
                              className="absolute right-1/2 w-1/2 h-0.5"
                              style={{ backgroundColor: done ? stage.color : '#e5e7eb' }}
                            />
                          )}
                          {i < STAGES.length - 1 && (
                            <div
                              className="absolute left-1/2 w-1/2 h-0.5"
                              style={{ backgroundColor: i < stageIdx ? STAGES[i + 1].color : '#e5e7eb' }}
                            />
                          )}
                          <div
                            className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                            style={{
                              backgroundColor: done ? stage.color + '20' : 'white',
                              borderColor: done ? stage.color : '#e5e7eb',
                            }}
                          >
                            {done
                              ? <CheckCircle className="h-4 w-4" style={{ color: stage.color }} />
                              : active
                              ? <Clock className="h-4 w-4 text-gray-300" />
                              : <Circle className="h-3 w-3 text-gray-200" />
                            }
                          </div>
                        </div>
                        <p className={`text-[10px] text-center font-medium ${done ? 'text-gray-700' : 'text-gray-300'}`}>
                          {stage.label}
                        </p>
                        {date && (
                          <p className="text-[9px] text-gray-400">
                            {format(new Date(date), 'dd.MM.yy')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
