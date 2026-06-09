'use client'

import { useState } from 'react'
import { ClipboardList, CheckCircle, XCircle, Users, HelpCircle } from 'lucide-react'

interface Survey {
  id: string
  title: string
  is_active: boolean
  course_title: string | null
  response_count: number
  question_count: number
  created_at: string
}

interface Props {
  surveys: Record<string, unknown>[]
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('uz-Latn-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function SurveysAdmin({ surveys: raw }: Props) {
  const surveys = raw as unknown as Survey[]
  const [list, setList] = useState(surveys)

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/surveys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      })
      if (res.ok) setList((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s))
    } catch {}
  }

  const active = list.filter((s) => s.is_active).length
  const totalResponses = list.reduce((a, s) => a + (s.response_count ?? 0), 0)

  if (list.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-16 text-center">
        <ClipboardList className="h-12 w-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">So&apos;rovnomalar yo&apos;q</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Jami so\'rovnoma', value: list.length, icon: ClipboardList, color: '#0B3D91' },
          { label: 'Faol', value: active, icon: CheckCircle, color: '#0f766e' },
          { label: 'Jami javoblar', value: totalResponses, icon: Users, color: '#7c3aed' },
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">№</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">So&apos;rovnoma</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Savollar</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Javoblar</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((s, i) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-purple-50">
                      <ClipboardList className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{s.title}</p>
                      {s.course_title && <p className="text-xs text-gray-400 mt-0.5">{String(s.course_title)}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                    <HelpCircle className="h-3 w-3 text-gray-400" />
                    {s.question_count ?? 0} ta
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                    <Users className="h-3 w-3 text-gray-400" />
                    {s.response_count ?? 0} ta
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  {s.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Faol
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Nofaol
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => toggleActive(s.id, s.is_active)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      s.is_active
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-green-200 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {s.is_active ? <><XCircle className="h-3 w-3" />O&apos;chirish</> : <><CheckCircle className="h-3 w-3" />Faollashtirish</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
