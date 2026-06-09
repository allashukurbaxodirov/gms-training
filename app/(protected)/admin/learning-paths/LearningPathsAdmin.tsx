'use client'

import { useState, useTransition } from 'react'
import { BookOpen, Eye, EyeOff, Plus, X, Layers } from 'lucide-react'

interface LearningPath {
  id: string
  title: string
  description: string | null
  is_published: boolean
  level: string | null
  estimated_hours: number
  course_count: number
  target_role: string | null
}

interface Props {
  paths: Record<string, unknown>[]
  showAddButton?: boolean
  tableOnly?: boolean
}

export function LearningPathsAdmin({ paths: rawPaths, showAddButton, tableOnly }: Props) {
  const paths = rawPaths as unknown as LearningPath[]
  const [list, setList] = useState<LearningPath[]>(paths)
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function togglePublish(id: string, current: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/learning-paths/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_published: !current }),
        })
        if (res.ok) {
          setList((prev) =>
            prev.map((p) => (p.id === id ? { ...p, is_published: !current } : p))
          )
        }
      } catch {}
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Nomi majburiy'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/learning-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description, is_published: false }),
      })
      if (res.ok) {
        const created = await res.json()
        setList((prev) => [...prev, { ...created, course_count: 0, target_role: null }])
        setShowModal(false)
        setForm({ title: '', description: '' })
      } else {
        const j = await res.json()
        setError(j.error ?? 'Xatolik')
      }
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  if (showAddButton) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#0B3D91' }}
        >
          <Plus className="h-4 w-4" />
          Yangi reja
        </button>

        {/* Create modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Yangi o&apos;quv rejasi</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="O'quv rejasi nomi..."
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Qisqacha tavsif..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] resize-none"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50"
                  >
                    Bekor
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: '#0B3D91' }}
                  >
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )
  }

  // Table only
  if (list.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-16 text-center">
        <Layers className="h-12 w-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">O&apos;quv rejalari yo&apos;q</p>
        <p className="text-gray-300 text-sm mt-1">Yangi reja qo&apos;shing</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">№</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nomi</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Kurslar soni</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Maqsadli rol</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Amallar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {list.map((lp, i) => (
            <tr key={lp.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-gray-400 text-xs font-medium">{i + 1}</td>
              <td className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: '#eff6ff' }}
                  >
                    <BookOpen className="h-4 w-4" style={{ color: '#0B3D91' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{lp.title}</p>
                    {lp.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 max-w-md">{lp.description}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center justify-center w-12 h-6 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {lp.course_count} ta
                </span>
              </td>
              <td className="px-4 py-4 text-center text-gray-400 text-sm">—</td>
              <td className="px-4 py-4 text-center">
                {lp.is_published ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Chop etilgan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    Qoralama
                  </span>
                )}
              </td>
              <td className="px-4 py-4 text-right">
                <button
                  onClick={() => togglePublish(lp.id, lp.is_published)}
                  disabled={isPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    lp.is_published
                      ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                      : 'border-green-200 text-green-700 hover:bg-green-50'
                  }`}
                >
                  {lp.is_published ? (
                    <><EyeOff className="h-3 w-3" />Yashirish</>
                  ) : (
                    <><Eye className="h-3 w-3" />Chop etish</>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
