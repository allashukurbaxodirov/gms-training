'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { CircleUser, Phone, Globe, Flame, Sparkles, Trophy, ShieldCheck } from 'lucide-react'
import { PageLayout } from '@/components/ui/PageLayout'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ phone: '', language: 'uz', avatar_url: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        phone: (user as unknown as Record<string, string>).phone ?? '',
        language: (user as unknown as Record<string, string>).language ?? 'uz',
        avatar_url: user.avatar_url ?? '',
      })
    }
  }, [user])

  if (!user) return null

  const role = user.role as Role
  const initials = user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      updateUser({ avatar_url: form.avatar_url || null })
      toast.success('Profil saqlandi')
      setEditing(false)
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout title="Profilim">
      <div className="max-w-2xl space-y-5">

      {/* Avatar + name card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ backgroundColor: '#0B3D91' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{ROLE_LABELS[role] ?? 'Foydalanuvchi'}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                Tabel: {user.tab_number}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <CircleUser className="h-3.5 w-3.5 text-gray-400" />
                {user.login}
              </span>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="shrink-0 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
          >
            {editing ? 'Bekor' : 'Tahrirlash'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Sparkles className="h-5 w-5" />, label: 'XP Bal', value: user.xp_points ?? 0, color: '#FFB81C' },
          { icon: <Trophy className="h-5 w-5" />, label: 'Daraja', value: `Lv.${user.level ?? 1}`, color: '#0B3D91' },
          { icon: <Flame className="h-5 w-5" />, label: 'Streak', value: `${(user as unknown as Record<string, number>).streak_days ?? 0} kun`, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Ma&apos;lumotlarni tahrirlash</h3>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Phone className="h-3.5 w-3.5" /> Telefon raqam
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+998 90 123 45 67"
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Globe className="h-3.5 w-3.5" /> Til
            </label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] bg-white"
            >
              <option value="uz">O&apos;zbek</option>
              <option value="ru">Русский</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Avatar URL</label>
            <input
              type="url"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-all"
            style={{ backgroundColor: '#0B3D91' }}
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      )}
      </div>
    </PageLayout>
  )
}
