'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { X, ChevronRight, ChevronLeft, Users, Calendar, CheckCircle, Loader2 } from 'lucide-react'

interface Subdivision { id: string; code: string; name: string }
interface Shift { id: string; code: string; name: string }
interface Trainer { id: string; full_name: string; tab_number: string }

interface Props {
  courseId: string
  courseTitle: string
  onClose: () => void
}

const STEP_LABELS = ['Qamrov', 'Sana & Trener', 'Tasdiqlash']

export function EnrollWizard({ courseId, courseTitle, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])

  // Step 1
  const [selSubdivisions, setSelSubdivisions] = useState<string[]>([])
  const [selShifts, setSelShifts] = useState<string[]>([])

  // Step 2
  const [plannedDate, setPlannedDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [isMandatory, setIsMandatory] = useState(false)

  // Step 3
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/subdivisions').then(r => r.json()).then(setSubdivisions).catch(() => {})
    fetch('/api/shifts').then(r => r.json()).then(setShifts).catch(() => {})
    fetch('/api/trainers').then(r => r.json()).then(setTrainers).catch(() => {})
  }, [])

  const fetchPreview = useCallback(async () => {
    setLoadingPreview(true)
    setPreviewCount(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdivision_ids: selSubdivisions,
          shift_ids: selShifts,
          preview: true,
        }),
      })
      const d = await res.json()
      setPreviewCount(d.count ?? 0)
    } catch {
      setPreviewCount(0)
    } finally {
      setLoadingPreview(false)
    }
  }, [courseId, selSubdivisions, selShifts])

  function goNext() {
    if (step === 2 && !plannedDate) {
      toast.error('Rejadagi sana kiritilishi shart')
      return
    }
    if (step === 2) fetchPreview()
    setStep(s => s + 1)
  }

  function goPrev() { setStep(s => s - 1) }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdivision_ids: selSubdivisions,
          shift_ids: selShifts,
          planned_date: plannedDate || null,
          deadline: deadline || null,
          trainer_id: trainerId || null,
          is_mandatory: isMandatory,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(`${d.enrolled} ta xodimga kurs tayinlandi`)
      onClose()
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleSubdiv(id: string) {
    setSelSubdivisions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleShift(id: string) {
    setSelShifts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectedSubdivNames = subdivisions
    .filter(s => selSubdivisions.includes(s.id))
    .map(s => s.name)

  const selectedShiftNames = shifts
    .filter(s => selShifts.includes(s.id))
    .map(s => s.name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Kursni e&apos;lon qilish</h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{courseTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 px-6 py-4 border-b border-gray-50">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const active = step === n
            const done = step > n
            return (
              <div key={n} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      backgroundColor: done ? '#10b981' : active ? '#0B3D91' : '#e5e7eb',
                      color: (done || active) ? '#ffffff' : '#9ca3af',
                    }}
                  >
                    {done ? <CheckCircle className="h-4 w-4" /> : n}
                  </div>
                  <span
                    className="text-xs font-medium hidden sm:block"
                    style={{ color: active ? '#0B3D91' : done ? '#10b981' : '#9ca3af' }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className="w-8 sm:w-12 h-0.5 mx-2 rounded"
                    style={{ backgroundColor: done ? '#10b981' : '#e5e7eb' }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[280px]">
          {/* Step 1 — Qamrov */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2.5">
                  Uchastkalar <span className="text-xs font-normal text-gray-400 ml-1">(bo&apos;sh = barchasi)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {subdivisions.map(s => {
                    const sel = selSubdivisions.includes(s.id)
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSubdiv(s.id)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: sel ? '#0B3D91' : '#e5e7eb',
                          backgroundColor: sel ? '#eff6ff' : '#f9fafb',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                          style={{
                            borderColor: sel ? '#0B3D91' : '#d1d5db',
                            backgroundColor: sel ? '#0B3D91' : 'transparent',
                          }}
                        >
                          {sel && <div className="w-2 h-2 rounded-sm bg-white" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{s.name.replace(' uchastkasi', '')}</p>
                          <p className="text-[10px] text-gray-400">{s.code}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2.5">
                  Smena <span className="text-xs font-normal text-gray-400 ml-1">(bo&apos;sh = barchasi)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {shifts.map(s => {
                    const sel = selShifts.includes(s.id)
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleShift(s.id)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: sel ? '#0B3D91' : '#e5e7eb',
                          backgroundColor: sel ? '#eff6ff' : '#f9fafb',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                          style={{
                            borderColor: sel ? '#0B3D91' : '#d1d5db',
                            backgroundColor: sel ? '#0B3D91' : 'transparent',
                          }}
                        >
                          {sel && <div className="w-2 h-2 rounded-sm bg-white" />}
                        </div>
                        <p className="text-xs font-semibold text-gray-800">{s.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Sana & Trener */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Rejadagi sana <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={e => setPlannedDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Yakunlash muddati
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    min={plannedDate}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Trener (ixtiyoriy)
                </label>
                <select
                  value={trainerId}
                  onChange={e => setTrainerId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] bg-white transition-all"
                >
                  <option value="">— Trener tanlanmagan —</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.tab_number})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none mt-2">
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={e => setIsMandatory(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#0B3D91]"
                />
                <span className="text-sm text-gray-700">Majburiy kurs sifatida belgilash</span>
              </label>
            </div>
          )}

          {/* Step 3 — Tasdiqlash */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Qamrov xulosasi</span>
                </div>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex justify-between">
                    <span>Uchastkalar:</span>
                    <span className="font-medium">
                      {selectedSubdivNames.length > 0 ? selectedSubdivNames.join(', ').replace(/ uchastkasi/g, '') : 'Barchasi'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Smenalar:</span>
                    <span className="font-medium">
                      {selectedShiftNames.length > 0 ? selectedShiftNames.join(', ') : 'Barchasi'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejadagi sana:</span>
                    <span className="font-medium">{plannedDate || '—'}</span>
                  </div>
                  {deadline && (
                    <div className="flex justify-between">
                      <span>Muddat:</span>
                      <span className="font-medium">{deadline}</span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="rounded-xl p-4 flex items-center justify-center gap-3"
                style={{ backgroundColor: '#f0f4f8', border: '2px dashed #cbd5e1' }}
              >
                {loadingPreview ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Hisoblanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-5 w-5 text-[#0B3D91]" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{previewCount ?? '—'}</p>
                      <p className="text-xs text-gray-500">xodimga kurs tayinlanadi</p>
                    </div>
                  </>
                )}
              </div>

              {previewCount === 0 && !loadingPreview && (
                <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                  ⚠️ Tanlangan mezonlar bo&apos;yicha xodimlar topilmadi. Filtrlasrni tekshiring.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {step > 1 ? (
            <button
              onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-white transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Orqaga
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-white transition-all"
            >
              Bekor
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: '#0B3D91' }}
            >
              Davom etish
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || previewCount === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: '#10b981' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tayinlanmoqda...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Tasdiqlash va e&apos;lon qilish
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
