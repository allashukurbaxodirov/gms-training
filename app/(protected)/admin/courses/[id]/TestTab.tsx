'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, X, Save, Loader2, CheckCircle2, List, ToggleLeft, AlignLeft, ChevronDown, ChevronUp } from 'lucide-react'
import type { Test, Question, QuestionOption } from '@/lib/queries/courses'

const QUESTION_TYPES = [
  { value: 'single',     label: 'Bir tanlov',      icon: CheckCircle2, color: '#3b82f6' },
  { value: 'multiple',   label: "Ko'p tanlov",      icon: List,         color: '#8b5cf6' },
  { value: 'truefalse',  label: "To'g'ri/Noto'g'ri", icon: ToggleLeft, color: '#10b981' },
  { value: 'text',       label: 'Matn javob',       icon: AlignLeft,    color: '#f59e0b' },
]

interface QuestionWithTest extends Question {
  test_id: string
}

interface TestWithQuestions extends Test {
  questions: QuestionWithTest[]
}

interface Props {
  courseId: string
  initialTest: TestWithQuestions | null
}

interface TestForm {
  title: string
  description: string
  time_limit_minutes: string
  passing_score: string
  max_attempts: string
  shuffle_questions: boolean
  xp_reward: string
}

interface QuestionForm {
  text: string
  type: string
  options: { text: string; is_correct: boolean }[]
  correct_text: string
  points: string
  explanation: string
}

function defaultTestForm(test?: Test | null): TestForm {
  return {
    title: test?.title ?? 'Yakuniy test',
    description: '',
    time_limit_minutes: test?.time_limit_minutes?.toString() ?? '',
    passing_score: test?.passing_score?.toString() ?? '70',
    max_attempts: test?.max_attempts?.toString() ?? '3',
    shuffle_questions: test?.shuffle_questions ?? false,
    xp_reward: test?.xp_reward?.toString() ?? '50',
  }
}

function defaultQuestionForm(): QuestionForm {
  return {
    text: '',
    type: 'single',
    options: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
    ],
    correct_text: '',
    points: '1',
    explanation: '',
  }
}

export function TestTab({ courseId, initialTest }: Props) {
  const [test, setTest] = useState<TestWithQuestions | null>(initialTest)
  const [questions, setQuestions] = useState<QuestionWithTest[]>(initialTest?.questions ?? [])

  // Test settings form
  const [testForm, setTestForm] = useState<TestForm>(defaultTestForm(initialTest))
  const [savingTest, setSavingTest] = useState(false)
  const [testExpanded, setTestExpanded] = useState(!initialTest)

  // Question modal
  const [showQModal, setShowQModal] = useState(false)
  const [editQuestion, setEditQuestion] = useState<QuestionWithTest | null>(null)
  const [qForm, setQForm] = useState<QuestionForm>(defaultQuestionForm())
  const [savingQ, setSavingQ] = useState(false)
  const [deletingQ, setDeletingQ] = useState<string | null>(null)

  async function handleSaveTest(e: React.FormEvent) {
    e.preventDefault()
    if (!testForm.title.trim()) { toast.error('Test nomi kiritilishi shart'); return }
    setSavingTest(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testForm.title.trim(),
          description: testForm.description || null,
          time_limit_minutes: testForm.time_limit_minutes ? parseInt(testForm.time_limit_minutes) : null,
          passing_score: parseInt(testForm.passing_score) || 70,
          max_attempts: parseInt(testForm.max_attempts) || 3,
          shuffle_questions: testForm.shuffle_questions,
          xp_reward: parseInt(testForm.xp_reward) || 50,
        }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setTest({ ...saved, questions })
      toast.success('Test saqlandi')
      setTestExpanded(false)
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSavingTest(false)
    }
  }

  function openCreateQ() {
    setEditQuestion(null)
    setQForm(defaultQuestionForm())
    setShowQModal(true)
  }

  function openEditQ(q: QuestionWithTest) {
    setEditQuestion(q)
    const parsedOpts: { text: string; is_correct: boolean }[] = Array.isArray(q.options)
      ? q.options
      : (typeof q.options === 'string' ? JSON.parse(q.options) : [])
    setQForm({
      text: q.text,
      type: q.type,
      options: parsedOpts.length > 0 ? parsedOpts : [{ text: '', is_correct: true }, { text: '', is_correct: false }],
      correct_text: q.correct_text ?? '',
      points: q.points?.toString() ?? '1',
      explanation: q.explanation ?? '',
    })
    setShowQModal(true)
  }

  async function handleSaveQ() {
    if (!qForm.text.trim()) { toast.error('Savol matni kiritilishi shart'); return }
    if (['single', 'multiple', 'truefalse'].includes(qForm.type)) {
      const hasCorrect = qForm.options.some(o => o.is_correct)
      if (!hasCorrect) { toast.error("To'g'ri javob belgilanishi shart"); return }
    }

    setSavingQ(true)
    const payload = {
      text: qForm.text.trim(),
      type: qForm.type,
      options: ['single', 'multiple', 'truefalse'].includes(qForm.type)
        ? qForm.options.filter(o => o.text.trim())
        : [],
      correct_text: qForm.type === 'text' ? qForm.correct_text : null,
      points: parseInt(qForm.points) || 1,
      explanation: qForm.explanation || null,
    }

    try {
      if (editQuestion) {
        const res = await fetch(`/api/courses/${courseId}/test/questions/${editQuestion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        setQuestions(prev => prev.map(q =>
          q.id === editQuestion.id ? { ...q, ...payload } : q
        ))
        toast.success('Savol yangilandi')
      } else {
        const res = await fetch(`/api/courses/${courseId}/test/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const newQ = await res.json()
        setQuestions(prev => [...prev, newQ])
        toast.success("Savol qo'shildi")
      }
      setShowQModal(false)
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSavingQ(false)
    }
  }

  async function handleDeleteQ(q: QuestionWithTest) {
    if (!confirm(`"${q.text.slice(0, 50)}..." savolini o'chirmoqchimisiz?`)) return
    setDeletingQ(q.id)
    try {
      const res = await fetch(`/api/courses/${courseId}/test/questions/${q.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setQuestions(prev => prev.filter(x => x.id !== q.id))
      toast.success("Savol o'chirildi")
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setDeletingQ(null)
    }
  }

  function toggleOptionCorrect(idx: number) {
    if (qForm.type === 'single') {
      setQForm(f => ({
        ...f,
        options: f.options.map((o, i) => ({ ...o, is_correct: i === idx }))
      }))
    } else {
      setQForm(f => ({
        ...f,
        options: f.options.map((o, i) => i === idx ? { ...o, is_correct: !o.is_correct } : o)
      }))
    }
  }

  function addOption() {
    setQForm(f => ({ ...f, options: [...f.options, { text: '', is_correct: false }] }))
  }

  function removeOption(idx: number) {
    setQForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }))
  }

  const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <>
      <div className="space-y-5">
        {/* Test settings card */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setTestExpanded(!testExpanded)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-100/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B3D91] flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">
                  {test ? test.title : "Test sozlamalari"}
                </p>
                {test && (
                  <p className="text-xs text-gray-400">
                    O&apos;tish: {test.passing_score}% · Vaqt: {test.time_limit_minutes ? `${test.time_limit_minutes} daq` : "Cheksiz"} · Max urinish: {test.max_attempts}
                  </p>
                )}
              </div>
            </div>
            {testExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>

          {testExpanded && (
            <form onSubmit={handleSaveTest} className="px-5 pb-5 space-y-4 border-t border-gray-100">
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Test sarlavhasi *</label>
                <input
                  type="text"
                  value={testForm.title}
                  onChange={e => setTestForm({ ...testForm, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">O&apos;tish bali (%)</label>
                  <input
                    type="number" min="0" max="100"
                    value={testForm.passing_score}
                    onChange={e => setTestForm({ ...testForm, passing_score: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vaqt limiti (daq)</label>
                  <input
                    type="number" min="0"
                    value={testForm.time_limit_minutes}
                    onChange={e => setTestForm({ ...testForm, time_limit_minutes: e.target.value })}
                    placeholder="0 = cheksiz"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max urinish</label>
                  <input
                    type="number" min="1"
                    value={testForm.max_attempts}
                    onChange={e => setTestForm({ ...testForm, max_attempts: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">XP mukofot</label>
                  <input
                    type="number" min="0"
                    value={testForm.xp_reward}
                    onChange={e => setTestForm({ ...testForm, xp_reward: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testForm.shuffle_questions}
                  onChange={e => setTestForm({ ...testForm, shuffle_questions: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 accent-[#0B3D91]"
                />
                <span className="text-sm text-gray-700">Savollarni aralashtirish</span>
              </label>
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={savingTest}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: '#0B3D91' }}
                >
                  {savingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingTest ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Questions section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{questions.length} ta savol</p>
            <button
              onClick={openCreateQ}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#0B3D91' }}
            >
              <Plus className="h-4 w-4" />
              Yangi savol
            </button>
          </div>

          {questions.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <List className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Hali savollar qo&apos;shilmagan</p>
              <button onClick={openCreateQ} className="mt-2 text-sm font-medium text-[#0B3D91] hover:underline">
                Birinchi savolni qo&apos;shing →
              </button>
            </div>
          )}

          {questions.map((q, idx) => {
            const typeInfo = QUESTION_TYPES.find(t => t.value === q.type)
            const Icon = typeInfo?.icon ?? CheckCircle2
            const opts = Array.isArray(q.options)
              ? q.options
              : (typeof q.options === 'string' ? JSON.parse(q.options) : [])
            const correctCount = opts.filter((o: { is_correct: boolean }) => o.is_correct).length
            return (
              <div key={q.id} className="flex gap-3 px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">
                <span className="text-xs text-gray-400 font-medium w-5 text-center shrink-0 mt-0.5">{idx + 1}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${typeInfo?.color ?? '#6b7280'}20` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: typeInfo?.color ?? '#6b7280' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{q.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400">{typeInfo?.label}</span>
                    {q.options?.length > 0 && (
                      <span className="text-[11px] text-gray-400">
                        · {q.options.length} variant · {correctCount} to&apos;g&apos;ri
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">· {q.points} ball</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEditQ(q)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0B3D91] hover:bg-white transition-all">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQ(q)}
                    disabled={deletingQ === q.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition-all disabled:opacity-50"
                  >
                    {deletingQ === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Question Modal */}
      {showQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowQModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editQuestion ? 'Savolni tahrirlash' : "Yangi savol qo'shish"}
              </h3>
              <button onClick={() => setShowQModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
              {/* Question type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Savol turi</label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPES.map(qt => {
                    const active = qForm.type === qt.value
                    return (
                      <button
                        key={qt.value}
                        type="button"
                        onClick={() => {
                          let opts = qForm.options
                          if (qt.value === 'truefalse') {
                            opts = [
                              { text: "To'g'ri", is_correct: true },
                              { text: "Noto'g'ri", is_correct: false },
                            ]
                          } else if (qt.value === 'text') {
                            opts = []
                          } else if (opts.length === 0) {
                            opts = [{ text: '', is_correct: true }, { text: '', is_correct: false }]
                          }
                          setQForm(f => ({ ...f, type: qt.value, options: opts }))
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border-2"
                        style={{
                          borderColor: active ? qt.color : '#e5e7eb',
                          backgroundColor: active ? qt.color : 'transparent',
                          color: active ? '#ffffff' : '#6b7280',
                        }}
                      >
                        {qt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Savol matni <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={qForm.text}
                  onChange={e => setQForm({ ...qForm, text: e.target.value })}
                  placeholder="Savol matnini kiriting..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>

              {/* Options for single/multiple/truefalse */}
              {['single', 'multiple', 'truefalse'].includes(qForm.type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Javob variantlari
                    <span className="text-xs text-gray-400 ml-2 font-normal">
                      ({qForm.type === 'single' ? 'bitta to\'g\'ri' : 'bir nechta to\'g\'ri bo\'lishi mumkin'})
                    </span>
                  </label>
                  <div className="space-y-2">
                    {qForm.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                        >
                          {OPTION_LETTERS[idx] ?? (idx + 1)}
                        </span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={e => {
                            const opts = [...qForm.options]
                            opts[idx] = { ...opts[idx], text: e.target.value }
                            setQForm({ ...qForm, options: opts })
                          }}
                          disabled={qForm.type === 'truefalse'}
                          placeholder={`${idx + 1}-variant...`}
                          className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => toggleOptionCorrect(idx)}
                          title="To'g'ri javob"
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0"
                          style={{
                            backgroundColor: opt.is_correct ? '#10b981' : '#e5e7eb',
                            color: opt.is_correct ? '#ffffff' : '#9ca3af',
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        {qForm.type !== 'truefalse' && qForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {qForm.type !== 'truefalse' && qForm.options.length < 6 && (
                      <button
                        type="button"
                        onClick={addOption}
                        className="flex items-center gap-1.5 text-sm text-[#0B3D91] hover:underline mt-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Variant qo&apos;shish
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Text answer */}
              {qForm.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    To&apos;g&apos;ri javob (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={qForm.correct_text}
                    onChange={e => setQForm({ ...qForm, correct_text: e.target.value })}
                    placeholder="Kutilayotgan javob..."
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ball</label>
                  <input
                    type="number" min="0"
                    value={qForm.points}
                    onChange={e => setQForm({ ...qForm, points: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Izoh (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={qForm.explanation}
                    onChange={e => setQForm({ ...qForm, explanation: e.target.value })}
                    placeholder="Tushuntirish..."
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => setShowQModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-white transition-all">
                Bekor
              </button>
              <button
                onClick={handleSaveQ}
                disabled={savingQ}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
                style={{ backgroundColor: '#0B3D91' }}
              >
                {savingQ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingQ ? 'Saqlanmoqda...' : editQuestion ? 'Yangilash' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
