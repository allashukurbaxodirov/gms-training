'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ login: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.login.trim() || !form.password) {
      toast.error('Login va parol kiritilishi shart')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Xatolik yuz berdi')
        return
      }
      toast.success('Xush kelibsiz!')
      router.push(data.redirect || '/')
      router.refresh()
    } catch {
      toast.error("Server bilan aloqa yo'q")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f4f8' }}>

      {/* Left panel - brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white"
        style={{ background: 'linear-gradient(160deg, #0B3D91 0%, #082d6e 100%)' }}
      >
        {/* UA Logo */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <svg viewBox="0 0 100 100" className="w-14 h-14">
              <rect width="100" height="100" rx="16" fill="transparent"/>
              <g fill="none" stroke="#FFB81C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="translate(20 15)">
                <path d="M30 0L60 15v30L30 60L0 45V15z"/>
                <path d="M30 0L30 60"/>
                <path d="M0 15L60 15"/>
                <path d="M0 45L60 45"/>
              </g>
              <text x="50" y="92" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="700" fill="#FFB81C" letterSpacing="1">UA · LMS</text>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">UzAuto · Akademiya</h1>
          <p className="mt-2 text-blue-200 text-lg">Korporativ o&apos;quv platformasi</p>
        </div>

        {/* Features */}
        <div className="space-y-3 w-full max-w-xs">
          {[
            { icon: '📚', text: '500+ kurs va darsliklar' },
            { icon: '🏆', text: 'Sertifikatlar va reytinglar' },
            { icon: '🎯', text: 'JIT ko\'nikma baholash' },
            { icon: '📊', text: 'O\'quv tahlili va hisobotlar' },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-sm text-blue-100">
              <span className="text-base">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-lg"
              style={{ backgroundColor: '#0B3D91' }}
            >
              UA · Akademiya
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tizimga kirish</h2>
              <p className="text-sm text-gray-500 mt-1">
                Tabel raqam yoki login va parolni kiriting
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Login / Tabel raqam
                </label>
                <input
                  type="text"
                  placeholder="login yoki T00123"
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  disabled={loading}
                  autoFocus
                  autoComplete="username"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[var(--ua-navy)] focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Parol
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[var(--ua-navy)] focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ backgroundColor: '#0B3D91' }}
              >
                {loading ? 'Yuklanmoqda...' : 'Kirish'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Muammo bo&apos;lsa, IT bo&apos;limiga murojaat qiling
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
