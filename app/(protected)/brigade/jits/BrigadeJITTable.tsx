'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronRight, CheckCircle2 } from 'lucide-react'

const STAGES = ['planned', 'delivered', 'tested', 'can_teach'] as const
type Stage = typeof STAGES[number]

const STAGE_LABELS: Record<Stage, string> = {
  planned: 'Rejalashtirilgan',
  delivered: 'O\'tildi',
  tested: 'Sinovdan o\'tdi',
  can_teach: 'O\'qita oladi',
}

const STAGE_COLORS: Record<Stage, string> = {
  planned: '#6b7280',
  delivered: '#3b82f6',
  tested: '#f59e0b',
  can_teach: '#10b981',
}

interface Enrollment {
  enrollment_id: string
  user_id: string
  full_name: string
  tab_number: string
  job_title: string | null
  course_id: string
  course_title: string
  difficulty: string
  training_status: Stage | null
  progress_percent: number
}

interface Props {
  enrollments: Record<string, unknown>[]
}

export function BrigadeJITTable({ enrollments }: Props) {
  const [rows, setRows] = useState<Enrollment[]>(enrollments as unknown as Enrollment[])
  const [advancing, setAdvancing] = useState<string | null>(null)

  async function advanceStage(enrollmentId: string, currentStage: Stage | null) {
    const currentIdx = currentStage ? STAGES.indexOf(currentStage) : -1
    if (currentIdx >= STAGES.length - 1) return

    const nextStage = STAGES[currentIdx + 1]
    setAdvancing(enrollmentId)
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/training-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStage, date: new Date().toISOString().split('T')[0] }),
      })
      if (!res.ok) throw new Error()
      setRows((prev) =>
        prev.map((r) =>
          r.enrollment_id === enrollmentId ? { ...r, training_status: nextStage } : r
        )
      )
      toast.success(`${STAGE_LABELS[nextStage]} bosqichiga o'tkazildi`)
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setAdvancing(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-24 text-center">
        <p className="text-gray-500">Sizga biriktirilgan JIT yozuvlar yo&apos;q</p>
        <p className="text-xs text-gray-400 mt-1">Admin sizni murabbiy sifatida tayinlaganida bu yerda ko&apos;rinadi</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Xodim</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kurs</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Holat</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => {
              const stageIdx = row.training_status ? STAGES.indexOf(row.training_status) : -1
              const canAdvance = stageIdx < STAGES.length - 1
              const color = row.training_status ? STAGE_COLORS[row.training_status] : '#e5e7eb'
              const isAdvancing = advancing === row.enrollment_id

              return (
                <tr key={row.enrollment_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.full_name}</p>
                    <p className="text-xs text-gray-400">{row.tab_number}{row.job_title ? ` · ${row.job_title}` : ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-[200px] truncate">{row.course_title}</p>
                    <p className="text-xs text-gray-400 capitalize">{row.difficulty}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {row.training_status ? STAGE_LABELS[row.training_status] : 'Belgilanmagan'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${row.progress_percent}%`, backgroundColor: '#0B3D91' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{row.progress_percent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {canAdvance ? (
                      <button
                        onClick={() => advanceStage(row.enrollment_id, row.training_status)}
                        disabled={isAdvancing}
                        className="flex items-center gap-1 mx-auto px-3 py-1.5 rounded text-xs font-medium text-white disabled:opacity-50 transition-all"
                        style={{ backgroundColor: '#0B3D91' }}
                      >
                        {isAdvancing ? '...' : 'Keyingi'}
                        {!isAdvancing && <ChevronRight className="h-3 w-3" />}
                      </button>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Yakunlandi
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
