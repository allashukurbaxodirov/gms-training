'use client'

import { useState } from 'react'
import { Download, Search, FileText } from 'lucide-react'

interface ReportRow {
  full_name: string
  tab_number: string
  course_title: string
  status: string
  progress_percent: number
  score: number | null
  started_at: string | null
  completed_at: string | null
}

const STATUS_LABELS: Record<string, string> = {
  assigned: 'Tayinlangan',
  in_progress: 'Jarayonda',
  completed: 'Tugatildi',
  failed: 'Muvaffaqiyatsiz',
}

const STATUS_COLORS: Record<string, string> = {
  assigned: '#6b7280',
  in_progress: '#f59e0b',
  completed: '#10b981',
  failed: '#ef4444',
}

export function ReportsView() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function runReport() {
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res = await fetch(`/api/admin/reports?${params}`)
      if (res.ok) {
        const d = await res.json()
        setRows(d.rows ?? [])
      }
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  function downloadCSV() {
    const headers = ['Xodim', 'Tabel', 'Kurs', 'Holat', 'Progress', 'Ball', 'Boshlangan', 'Tugatilgan']
    const csvRows = [
      headers.join(','),
      ...rows.map((r) => [
        `"${r.full_name}"`,
        r.tab_number,
        `"${r.course_title}"`,
        STATUS_LABELS[r.status] ?? r.status,
        `${r.progress_percent}%`,
        r.score ? `${r.score}%` : '',
        r.started_at ? new Date(r.started_at).toLocaleDateString('uz-UZ') : '',
        r.completed_at ? new Date(r.completed_at).toLocaleDateString('uz-UZ') : '',
      ].join(','))
    ]
    const blob = new Blob(['﻿' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gms-hisobot-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Xodim yoki kurs nomini kiriting..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runReport()}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white"
        >
          <option value="">Barcha holat</option>
          <option value="assigned">Tayinlangan</option>
          <option value="in_progress">Jarayonda</option>
          <option value="completed">Tugatildi</option>
          <option value="failed">Muvaffaqiyatsiz</option>
        </select>
        <button
          onClick={runReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: '#0B3D91' }}
        >
          <FileText className="h-4 w-4" />
          {loading ? 'Yuklanmoqda...' : 'Hisobotni ko\'rish'}
        </button>
        {rows.length > 0 && (
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        )}
      </div>

      {/* Results */}
      {!searched ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Hisobotni ko&apos;rish uchun &quot;Ko&apos;rish&quot; tugmasini bosing</p>
        </div>
      ) : rows.length === 0 && !loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">Natija topilmadi</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{rows.length} ta natija</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {['Xodim', 'Tabel', 'Kurs', 'Holat', 'Progress', 'Ball', 'Tugatilgan'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.full_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.tab_number}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{r.course_title}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: (STATUS_COLORS[r.status] ?? '#6b7280') + '20',
                          color: STATUS_COLORS[r.status] ?? '#6b7280',
                        }}
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${r.progress_percent}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{r.progress_percent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.score ? `${r.score}%` : '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {r.completed_at ? new Date(r.completed_at).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
