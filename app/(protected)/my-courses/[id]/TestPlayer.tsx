'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  ClipboardList, Clock, CheckCircle2, XCircle,
  ChevronRight, ChevronLeft, Award, AlertCircle,
  RotateCcw, Check, Lock
} from 'lucide-react'

// ─── Tiplar ────────────────────────────────────────────────
interface Option {
  text: string
  is_correct: boolean
}

interface Question {
  id: string
  text: string
  type: 'single' | 'multiple' | 'truefalse' | 'text'
  options: Option[]
  correct_text: string | null
  points: number
  explanation?: string | null
  order_index?: number | null
}

export interface TestData {
  id: string
  title: string
  passing_score: number
  time_limit_minutes: number | null
  max_attempts: number
  questions: Question[]
}

interface TestPlayerProps {
  test: TestData
  enrollmentId: string | null
  courseId: string
  userId: string
  /** true bo'lsa — darslar hali tugatilmagan, test bloklangan */
  locked?: boolean
}

// ─── Natija holati ─────────────────────────────────────────
interface TestResult {
  score: number
  passed: boolean
  correct: number
  total: number
  detail: { questionId: string; correct: boolean; explanation?: string | null }[]
}

// ─── Asosiy komponent ──────────────────────────────────────
export function TestPlayer({ test, enrollmentId, userId, locked }: TestPlayerProps) {
  const [phase, setPhase] = useState<'intro' | 'taking' | 'result'>('intro')
  const [currentQ, setCurrentQ] = useState(0)
  // answers: { [questionId]: string | string[] }
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(
    test.time_limit_minutes ? test.time_limit_minutes * 60 : null
  )
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [showReview, setShowReview] = useState(false)

  const questions = test.questions

  // ─── Timer ───────────────────────────────────────────────
  const submitTest = useCallback(async (finalAnswers: Record<string, string | string[]>) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/tests/${test.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: finalAnswers,
          enrollmentId,
          userId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
        setPhase('result')
        if (data.passed) {
          toast.success('Tabriklaymiz! Kurs muvaffaqiyatli yakunlandi! 🎉', {
            duration: 5000,
          })
        } else {
          toast.error(`Test o'tilmadi — ${data.score}% (kerak: ${test.passing_score}%)`)
        }
      }
    } catch {
      // silent fail
    } finally {
      setSubmitting(false)
    }
  }, [submitting, test.id, enrollmentId, userId])

  useEffect(() => {
    if (phase !== 'taking' || timeLeft === null) return
    if (timeLeft <= 0) {
      submitTest(answers)
      return
    }
    const t = setTimeout(() => setTimeLeft(prev => (prev ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft, answers, submitTest])

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ─── Javob berish ─────────────────────────────────────────
  function handleSingle(qId: string, value: string) {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  function handleMultiple(qId: string, value: string) {
    setAnswers(prev => {
      const cur = (prev[qId] as string[] | undefined) ?? []
      const next = cur.includes(value)
        ? cur.filter(v => v !== value)
        : [...cur, value]
      return { ...prev, [qId]: next }
    })
  }

  function handleText(qId: string, value: string) {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  const q = questions[currentQ]
  const answered = q ? (
    q.type === 'multiple'
      ? ((answers[q.id] as string[] | undefined)?.length ?? 0) > 0
      : !!answers[q.id]
  ) : false

  const answeredCount = questions.filter(qq => {
    if (qq.type === 'multiple') return ((answers[qq.id] as string[] | undefined)?.length ?? 0) > 0
    return !!answers[qq.id]
  }).length

  // ─── LOCKED ──────────────────────────────────────────────
  if (locked) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1 rounded-t-2xl bg-gray-200" />
        <div className="p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
            <Lock className="h-8 w-8 text-gray-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-700">{test.title}</h2>
            <p className="text-sm text-gray-400 mt-1.5">
              Test qulfli — avval barcha darslarni ko&apos;rib tugatishi kerak
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-4 py-2.5 rounded-xl">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Barcha darslarni &quot;Bajarildi&quot; deb belgilang, so&apos;ng test faollashadi
          </div>
        </div>
      </div>
    )
  }

  // ─── INTRO ───────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1 rounded-t-2xl bg-[#0B3D91]" />
        <div className="p-8 flex flex-col items-center text-center gap-5">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <ClipboardList className="h-8 w-8 text-[#0B3D91]" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">{test.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Kursni yakunlash uchun testdan o&apos;ting</p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 bg-blue-50 text-[#0B3D91] px-3 py-1.5 rounded-full font-medium">
              <ClipboardList className="h-3.5 w-3.5" />
              {questions.length} ta savol
            </div>
            {test.time_limit_minutes && (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium">
                <Clock className="h-3.5 w-3.5" />
                {test.time_limit_minutes} daqiqa
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium">
              <Award className="h-3.5 w-3.5" />
              O&apos;tish bali: {test.passing_score}%
            </div>
            {test.max_attempts > 0 && (
              <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full font-medium">
                <RotateCcw className="h-3.5 w-3.5" />
                Maks. urinish: {test.max_attempts}
              </div>
            )}
          </div>

          {questions.length === 0 ? (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Hali savol qo&apos;shilmagan. Administrator savollarni qo&apos;shgandan keyin test faol bo&apos;ladi.
            </div>
          ) : (
            <button
              onClick={() => { setPhase('taking'); setCurrentQ(0) }}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-sm bg-[#0B3D91] hover:bg-[#082d6e] transition-colors shadow-sm"
            >
              Testni boshlash
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── RESULT ───────────────────────────────────────────────
  if (phase === 'result' && result) {
    const passed = result.passed
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`h-1.5 rounded-t-2xl ${passed ? 'bg-green-500' : 'bg-red-500'}`} />
        <div className="p-8 flex flex-col items-center text-center gap-5">
          {/* Result icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
            {passed
              ? <CheckCircle2 className="h-10 w-10 text-green-500" />
              : <XCircle className="h-10 w-10 text-red-500" />
            }
          </div>

          <div>
            <h2 className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? 'Tabriklaymiz! 🎉' : 'Muvaffaqiyatsiz'}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              {passed
                ? 'Siz testdan muvaffaqiyatli o\'tdingiz!'
                : `O'tish uchun ${test.passing_score}% kerak edi`}
            </p>
          </div>

          {/* Score */}
          <div className={`text-5xl font-bold ${passed ? 'text-green-600' : 'text-red-500'}`}>
            {result.score}%
          </div>

          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{result.correct}</p>
              <p className="text-gray-400">To&apos;g&apos;ri</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{result.total - result.correct}</p>
              <p className="text-gray-400">Noto&apos;g&apos;ri</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">{result.total}</p>
              <p className="text-gray-400">Jami</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setShowReview(!showReview)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:border-gray-300 transition-colors"
            >
              <ClipboardList className="h-4 w-4" />
              {showReview ? 'Yashirish' : 'Natijalarni ko\'rish'}
            </button>
            {!passed && (
              <button
                onClick={() => {
                  setAnswers({})
                  setCurrentQ(0)
                  setResult(null)
                  setTimeLeft(test.time_limit_minutes ? test.time_limit_minutes * 60 : null)
                  setPhase('intro')
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3D91] text-white font-medium text-sm hover:bg-[#082d6e] transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Qayta urinish
              </button>
            )}
          </div>
        </div>

        {/* Review */}
        {showReview && (
          <div className="border-t border-gray-100 divide-y divide-gray-50">
            {questions.map((qq, i) => {
              const detail = result.detail.find(d => d.questionId === qq.id)
              const isCorrect = detail?.correct ?? false
              const userAnswer = answers[qq.id]

              return (
                <div key={qq.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{qq.text}</p>

                      {/* Options review */}
                      {qq.type !== 'text' && qq.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {qq.options.map((opt, oi) => {
                            const selected = Array.isArray(userAnswer)
                              ? userAnswer.includes(oi.toString())
                              : userAnswer === oi.toString()
                            return (
                              <div key={oi} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                                opt.is_correct
                                  ? 'bg-green-50 text-green-700 font-medium'
                                  : selected && !opt.is_correct
                                    ? 'bg-red-50 text-red-600'
                                    : 'text-gray-500'
                              }`}>
                                {opt.is_correct
                                  ? <Check className="h-3 w-3 text-green-500 shrink-0" />
                                  : selected
                                    ? <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                                    : <div className="w-3 h-3" />
                                }
                                {opt.text}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Text answer review */}
                      {qq.type === 'text' && (
                        <div className="mt-2 text-xs text-gray-500">
                          Javobingiz: <span className="font-medium text-gray-700">{userAnswer as string || '—'}</span>
                          {qq.correct_text && (
                            <span className="ml-2 text-green-600">| To&apos;g&apos;ri: {qq.correct_text}</span>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {detail?.explanation && (
                        <p className="mt-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          💡 {detail.explanation}
                        </p>
                      )}
                    </div>
                    <div className={`shrink-0 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                      {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ─── TAKING ───────────────────────────────────────────────
  if (!q) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <span className="text-xs font-medium text-gray-500">
          Savol <span className="text-[#0B3D91] font-bold">{currentQ + 1}</span> / {questions.length}
        </span>

        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-0.5">
            {questions.map((qq, i) => {
              const ans = answers[qq.id]
              const isAns = qq.type === 'multiple'
                ? ((ans as string[] | undefined)?.length ?? 0) > 0
                : !!ans
              return (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentQ ? 'w-4 bg-[#0B3D91]' : isAns ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              )
            })}
          </div>

          {/* Timer */}
          {timeLeft !== null && (
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
              timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
            }`}>
              <Clock className="h-3 w-3" />
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-[#0B3D91] rounded-full transition-all"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question text */}
        <p className="text-base font-semibold text-gray-900 mb-5 leading-relaxed">{q.text}</p>

        {/* Type hint */}
        {q.type === 'multiple' && (
          <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg mb-4 inline-block">
            💡 Bir nechta to&apos;g&apos;ri javob bo&apos;lishi mumkin
          </p>
        )}

        {/* Options */}
        {(q.type === 'single' || q.type === 'truefalse') && (
          <div className="space-y-2.5">
            {q.type === 'truefalse'
              ? [{ text: "Ha (To'g'ri)", val: 'true' }, { text: "Yo'q (Noto'g'ri)", val: 'false' }].map(opt => (
                  <label
                    key={opt.val}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[q.id] === opt.val
                        ? 'border-[#0B3D91] bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.val}
                      checked={answers[q.id] === opt.val}
                      onChange={() => handleSingle(q.id, opt.val)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      answers[q.id] === opt.val ? 'border-[#0B3D91] bg-[#0B3D91]' : 'border-gray-300'
                    }`}>
                      {answers[q.id] === opt.val && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-gray-800">{opt.text}</span>
                  </label>
                ))
              : q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[q.id] === oi.toString()
                        ? 'border-[#0B3D91] bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={oi.toString()}
                      checked={answers[q.id] === oi.toString()}
                      onChange={() => handleSingle(q.id, oi.toString())}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      answers[q.id] === oi.toString() ? 'border-[#0B3D91] bg-[#0B3D91]' : 'border-gray-300'
                    }`}>
                      {answers[q.id] === oi.toString() && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-gray-800">{opt.text}</span>
                  </label>
                ))
            }
          </div>
        )}

        {q.type === 'multiple' && (
          <div className="space-y-2.5">
            {q.options.map((opt, oi) => {
              const selected = ((answers[q.id] as string[] | undefined) ?? []).includes(oi.toString())
              return (
                <label
                  key={oi}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    selected ? 'border-[#0B3D91] bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={oi.toString()}
                    checked={selected}
                    onChange={() => handleMultiple(q.id, oi.toString())}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    selected ? 'border-[#0B3D91] bg-[#0B3D91]' : 'border-gray-300'
                  }`}>
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-800">{opt.text}</span>
                </label>
              )
            })}
          </div>
        )}

        {q.type === 'text' && (
          <textarea
            value={(answers[q.id] as string | undefined) ?? ''}
            onChange={e => handleText(q.id, e.target.value)}
            placeholder="Javobingizni yozing..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] resize-none"
          />
        )}
      </div>

      {/* Footer nav */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
          disabled={currentQ === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Oldingi
        </button>

        <span className="text-xs text-gray-400 hidden sm:block">
          {answeredCount} / {questions.length} javob berildi
        </span>

        {currentQ < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(prev => prev + 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#0B3D91] hover:bg-[#082d6e] transition-colors"
          >
            Keyingi
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => submitTest(answers)}
            disabled={submitting || answeredCount === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <span className="animate-pulse">Yuborilmoqda...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Testni yakunlash
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
