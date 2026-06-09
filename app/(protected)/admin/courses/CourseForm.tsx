'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  course?: Record<string, unknown>
  onSaved?: () => void
}

export function CourseForm({ course, onSaved }: Props) {
  const router = useRouter()
  const isEdit = !!course?.id
  const [form, setForm] = useState({
    title: (course?.title as string) ?? '',
    description: (course?.description as string) ?? '',
    category: (course?.category as string) ?? '',
    difficulty: (course?.difficulty as string) ?? 'beginner',
    duration_minutes: (course?.duration_minutes as number) ?? 60,
    is_mandatory: (course?.is_mandatory as boolean) ?? false,
    is_published: (course?.is_published as boolean) ?? false,
    passing_score: (course?.passing_score as number) ?? 70,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Kurs nomi kiritilishi shart'); return }

    setSaving(true)
    try {
      const res = await fetch(
        isEdit ? `/api/courses/${course!.id}` : '/api/courses',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Xatolik yuz berdi')
        return
      }
      toast.success(isEdit ? 'Kurs yangilandi' : 'Kurs yaratildi')
      if (onSaved) {
        onSaved()
        router.refresh()
      } else {
        router.push('/admin/courses')
        router.refresh()
      }
    } catch {
      toast.error('Server bilan aloqa yo\'q')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Kurs nomi <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Masalan: GMS Audit standartlari"
          className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tavsif</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Kurs haqida qisqacha ma'lumot..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategoriya</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] bg-white transition-all"
          >
            <option value="">— Tanlanmagan —</option>
            <option value="Functional">Functional</option>
            <option value="GM-GMS">GM-GMS</option>
            <option value="Safety & Environment">Safety &amp; Environment</option>
            <option value="Others">Others</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Daraja</label>
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] bg-white"
          >
            <option value="beginner">Boshlang&apos;ich</option>
            <option value="intermediate">O&apos;rta</option>
            <option value="advanced">Murakkab</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Davomiylik (daqiqa)</label>
          <input
            type="number"
            min="0"
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">O&apos;tish bali (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.passing_score}
            onChange={(e) => setForm({ ...form, passing_score: parseInt(e.target.value) || 70 })}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_mandatory}
            onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 accent-[#0B3D91]"
          />
          <span className="text-sm text-gray-700">Majburiy kurs</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 accent-[#0B3D91]"
          />
          <span className="text-sm text-gray-700">Nashr etish</span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ backgroundColor: '#0B3D91' }}
        >
          {saving ? 'Saqlanmoqda...' : isEdit ? 'Yangilash' : 'Yaratish'}
        </button>
        <a
          href="/admin/courses"
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
        >
          Bekor qilish
        </a>
      </div>
    </form>
  )
}
