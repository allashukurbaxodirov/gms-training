'use client'

import { useState, useTransition } from 'react'
import { Video, MapPin, Calendar, Clock, Users, Plus, X, ExternalLink } from 'lucide-react'

interface LiveSession {
  id: string
  title: string
  description: string | null
  session_type: string | null
  meeting_url: string | null
  location: string | null
  scheduled_at: string | null
  duration_minutes: number | null
  max_participants: number | null
  is_cancelled: boolean
  trainer_name: string | null
  course_title: string | null
}

interface Props {
  sessions: Record<string, unknown>[]
  courses: Record<string, unknown>[]
  trainers: Record<string, unknown>[]
  showAddButton?: boolean
  tableOnly?: boolean
}

function fmtDt(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleString('uz-Latn-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function LiveSessionsAdmin({ sessions: raw, courses, trainers, showAddButton, tableOnly }: Props) {
  const sessions = raw as unknown as LiveSession[]
  const [list, setList] = useState(sessions)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  const [form, setForm] = useState({
    title: '', description: '', session_type: 'online',
    meeting_url: '', location: '', scheduled_at: '',
    duration_minutes: '60', max_participants: '30',
    trainer_id: '', course_id: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Nomi majburiy'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          duration_minutes: parseInt(form.duration_minutes) || 60,
          max_participants: parseInt(form.max_participants) || 30,
          trainer_id: form.trainer_id || null,
          course_id: form.course_id || null,
          scheduled_at: form.scheduled_at || null,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setList((prev) => [{ ...created, trainer_name: null, course_title: null }, ...prev])
        setShowModal(false)
        setForm({ title: '', description: '', session_type: 'online', meeting_url: '', location: '', scheduled_at: '', duration_minutes: '60', max_participants: '30', trainer_id: '', course_id: '' })
      } else {
        const j = await res.json(); setError(j.error ?? 'Xatolik')
      }
    } catch { setError('Tarmoq xatosi') } finally { setSaving(false) }
  }

  async function cancelSession(id: string) {
    startTransition(async () => {
      try {
        await fetch(`/api/admin/live-sessions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_cancelled: true }) })
        setList((prev) => prev.map((s) => s.id === id ? { ...s, is_cancelled: true } : s))
      } catch {}
    })
  }

  if (showAddButton) {
    return (
      <>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#0B3D91' }}>
          <Plus className="h-4 w-4" /> Yangi sessiya
        </button>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Yangi sessiya</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi *</label>
                  <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Sessiya nomi..." className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turi</label>
                    <select value={form.session_type} onChange={(e) => setForm(f => ({ ...f, session_type: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none bg-white">
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Gibrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Davomiyligi (min)</label>
                    <input type="number" value={form.duration_minutes} onChange={(e) => setForm(f => ({ ...f, duration_minutes: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sana va vaqt</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91]" />
                </div>
                {form.session_type === 'online' || form.session_type === 'hybrid' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zoom/Meet havolasi</label>
                    <input value={form.meeting_url} onChange={(e) => setForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="https://..." className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91]" />
                  </div>
                ) : null}
                {form.session_type === 'offline' || form.session_type === 'hybrid' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manzil</label>
                    <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Xona yoki bino..." className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91]" />
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">O&apos;qituvchi</label>
                    <select value={form.trainer_id} onChange={(e) => setForm(f => ({ ...f, trainer_id: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none bg-white">
                      <option value="">Tanlang...</option>
                      {(trainers as { id: string; full_name: string }[]).map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kurs</label>
                    <select value={form.course_id} onChange={(e) => setForm(f => ({ ...f, course_id: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none bg-white">
                      <option value="">Tanlang...</option>
                      {(courses as { id: string; title: string }[]).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max ishtirokchilar</label>
                  <input type="number" value={form.max_participants} onChange={(e) => setForm(f => ({ ...f, max_participants: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91]" />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">Bekor</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#0B3D91' }}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )
  }

  if (list.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-16 text-center">
        <Video className="h-12 w-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">Sessiyalar yo&apos;q</p>
        <p className="text-gray-300 text-sm mt-1">Yangi jonli sessiya qo&apos;shing</p>
      </div>
    )
  }

  const SESSION_TYPE: Record<string, { label: string; color: string }> = {
    online:  { label: 'Online',  color: '#0B3D91' },
    offline: { label: 'Offline', color: '#0f766e' },
    hybrid:  { label: 'Gibrid',  color: '#b45309' },
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">№</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sessiya nomi</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Turi</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Sana</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">O&apos;qituvchi</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Amallar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {list.map((s, i) => {
            const typeInfo = SESSION_TYPE[s.session_type ?? 'online'] ?? SESSION_TYPE.online
            return (
              <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${s.is_cancelled ? 'opacity-50' : ''}`}>
                <td className="px-4 py-4 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: typeInfo.color + '15' }}>
                      <Video className="h-4 w-4" style={{ color: typeInfo.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{s.title}</p>
                      {s.course_title && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{String(s.course_title)}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        {s.duration_minutes && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />{String(s.duration_minutes)} min
                          </span>
                        )}
                        {s.max_participants && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Users className="h-3 w-3" />max {String(s.max_participants)}
                          </span>
                        )}
                        {s.meeting_url && (
                          <a href={String(s.meeting_url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                            <ExternalLink className="h-3 w-3" />Havola
                          </a>
                        )}
                        {s.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />{String(s.location)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: typeInfo.color + '15', color: typeInfo.color }}>
                    {typeInfo.label}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {fmtDt(s.scheduled_at)}
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-gray-600">{s.trainer_name ? String(s.trainer_name) : '—'}</td>
                <td className="px-4 py-4 text-center">
                  {s.is_cancelled ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">Bekor</span>
                  ) : s.scheduled_at && new Date(s.scheduled_at) < new Date() ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">O&apos;tdi</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Rejalashtirilgan
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  {!s.is_cancelled && (
                    <button onClick={() => cancelSession(s.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                      Bekor qilish
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
