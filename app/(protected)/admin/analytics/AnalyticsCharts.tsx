'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

interface Props {
  enrollByMonth: Record<string, unknown>[]
  topCourses: Record<string, unknown>[]
  activeByWeek: Record<string, unknown>[]
}

export function AnalyticsCharts({ enrollByMonth, topCourses, activeByWeek }: Props) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Enrollments per month */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Yozilishlar (so&apos;nggi 12 oy)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={enrollByMonth as Record<string, number>[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Yozildi" fill="#0B3D91" radius={[3, 3, 0, 0]} />
            <Bar dataKey="completed" name="Tugatildi" fill="#FFB81C" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Active users by week */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Faol foydalanuvchilar (haftalik)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={activeByWeek as Record<string, number>[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="active_users"
              name="Faol xodimlar"
              stroke="#0B3D91"
              strokeWidth={2}
              dot={{ r: 3, fill: '#0B3D91' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top courses table */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Top kurslar (yozilish bo&apos;yicha)</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kurs nomi</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Yozildi</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tugatildi</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tugatish %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {topCourses.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-gray-400 font-medium">#{i + 1}</td>
                <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">{c.title as string}</td>
                <td className="px-5 py-3 text-right text-gray-700">{c.enrollments as number}</td>
                <td className="px-5 py-3 text-right text-gray-700">{c.completions as number}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${c.completion_rate as number}%`, backgroundColor: '#10b981' }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{c.completion_rate as number}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {topCourses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">Ma&apos;lumot yo&apos;q</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
