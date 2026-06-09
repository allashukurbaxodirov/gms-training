'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Plus, Trash2, Edit2, X, FileText, Video, FileType,
  Presentation, BookOpen, Table, Link as LinkIcon, Save, Loader2,
  Upload, CheckCircle
} from 'lucide-react'
import type { Lesson } from '@/lib/queries/courses'

// Fayl yuklash qo'llab-quvvatlanadigan turlar
const UPLOAD_ACCEPT: Record<string, string> = {
  pdf:   '.pdf,application/pdf',
  pptx:  '.pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint',
  word:  '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
  excel: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
  video: '.mp4,.webm,.ogv,video/*',
}

const CONTENT_TYPES = [
  { value: 'text',  label: 'Matn',     icon: FileText,     color: '#6366f1' },
  { value: 'video', label: 'Video',    icon: Video,        color: '#ef4444' },
  { value: 'pdf',   label: 'PDF',      icon: FileType,     color: '#f59e0b' },
  { value: 'pptx',  label: 'PPTX',    icon: Presentation, color: '#10b981' },
  { value: 'word',  label: 'Word',     icon: BookOpen,     color: '#3b82f6' },
  { value: 'excel', label: 'Excel',   icon: Table,        color: '#22c55e' },
  { value: 'link',  label: 'Link',    icon: LinkIcon,     color: '#8b5cf6' },
]

interface Props {
  courseId: string
  initialLessons: Lesson[]
}

interface LessonForm {
  title: string
  content_type: string
  content_url: string
  content_text: string
  duration_minutes: string
  xp_reward: string
}

interface UploadState {
  uploading: boolean
  fileName: string | null
}

const defaultForm = (): LessonForm => ({
  title: '',
  content_type: 'video',
  content_url: '',
  content_text: '',
  duration_minutes: '',
  xp_reward: '10',
})

export function LessonsTab({ courseId, initialLessons }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
  const [showModal, setShowModal] = useState(false)
  const [editLesson, setEditLesson] = useState<Lesson | null>(null)
  const [form, setForm] = useState<LessonForm>(defaultForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [upload, setUpload] = useState<UploadState>({ uploading: false, fileName: null })
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUpload({ uploading: true, fileName: file.name })
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm(f => ({ ...f, content_url: data.url }))
      toast.success(`"${file.name}" yuklandi`)
      setUpload({ uploading: false, fileName: file.name })
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Fayl yuklanmadi')
      setUpload({ uploading: false, fileName: null })
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openCreate() {
    setEditLesson(null)
    setForm(defaultForm())
    setUpload({ uploading: false, fileName: null })
    setShowModal(true)
  }

  function openEdit(lesson: Lesson) {
    setEditLesson(lesson)
    setForm({
      title: lesson.title,
      content_type: lesson.content_type,
      content_url: lesson.content_url ?? '',
      content_text: lesson.content_text ?? '',
      duration_minutes: lesson.duration_minutes?.toString() ?? '',
      xp_reward: lesson.xp_reward?.toString() ?? '10',
    })
    setUpload({ uploading: false, fileName: lesson.content_url ? lesson.content_url.split('/').pop() ?? null : null })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Dars nomi kiritilishi shart'); return }

    const needsUrl = ['video', 'pdf', 'pptx', 'word', 'excel', 'link'].includes(form.content_type)
    const needsText = form.content_type === 'text'
    if (needsUrl && !form.content_url.trim()) { toast.error('URL kiritilishi shart'); return }
    if (needsText && !form.content_text.trim()) { toast.error('Matn kiritilishi shart'); return }

    setSaving(true)
    const payload = {
      title: form.title.trim(),
      content_type: form.content_type,
      content_url: needsUrl ? form.content_url.trim() : null,
      content_text: needsText ? form.content_text.trim() : null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      xp_reward: form.xp_reward ? parseInt(form.xp_reward) : 10,
      is_required: true,
    }

    try {
      if (editLesson) {
        const res = await fetch(`/api/courses/${courseId}/lessons/${editLesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        setLessons(prev => prev.map(l =>
          l.id === editLesson.id ? { ...l, ...payload } : l
        ))
        toast.success('Dars yangilandi')
      } else {
        const res = await fetch(`/api/courses/${courseId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const newLesson = await res.json()
        setLessons(prev => [...prev, newLesson])
        toast.success('Dars qo\'shildi')
      }
      setShowModal(false)
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(lesson: Lesson) {
    if (!confirm(`"${lesson.title}" darsini o'chirmoqchimisiz?`)) return
    setDeleting(lesson.id)
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lesson.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setLessons(prev => prev.filter(l => l.id !== lesson.id))
      toast.success("Dars o'chirildi")
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setDeleting(null)
    }
  }

  const currentType = CONTENT_TYPES.find(t => t.value === form.content_type)!

  return (
    <>
      {/* Lessons list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{lessons.length} ta dars</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#0B3D91' }}
          >
            <Plus className="h-4 w-4" />
            Yangi dars
          </button>
        </div>

        {lessons.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Hali darslar qo&apos;shilmagan</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm font-medium text-[#0B3D91] hover:underline"
            >
              Birinchi darsni qo&apos;shing →
            </button>
          </div>
        )}

        {lessons.map((lesson, idx) => {
          const typeInfo = CONTENT_TYPES.find(t => t.value === lesson.content_type)
          const Icon = typeInfo?.icon ?? FileText
          return (
            <div
              key={lesson.id}
              className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group"
            >
              <span className="text-xs text-gray-400 font-medium w-5 text-center shrink-0">{idx + 1}</span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${typeInfo?.color ?? '#6b7280'}20` }}
              >
                <Icon className="h-4 w-4" style={{ color: typeInfo?.color ?? '#6b7280' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{lesson.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-gray-400 capitalize">{lesson.content_type}</span>
                  {lesson.duration_minutes && (
                    <span className="text-[11px] text-gray-400">· {lesson.duration_minutes} daq</span>
                  )}
                  <span className="text-[11px] text-gray-400">· {lesson.xp_reward} XP</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(lesson)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#0B3D91] hover:bg-white transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(lesson)}
                  disabled={deleting === lesson.id}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition-all disabled:opacity-50"
                >
                  {deleting === lesson.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editLesson ? 'Darsni tahrirlash' : 'Yangi dars qo\'shish'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Dars nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Masalan: GMS jarayoni va talablar"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Content type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kontent turi</label>
                <div className="grid grid-cols-4 gap-2">
                  {CONTENT_TYPES.map(ct => {
                    const Icon = ct.icon
                    const active = form.content_type === ct.value
                    return (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => { setForm({ ...form, content_type: ct.value, content_url: '', content_text: '' }); setUpload({ uploading: false, fileName: null }) }}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all"
                        style={{
                          borderColor: active ? ct.color : '#e5e7eb',
                          backgroundColor: active ? `${ct.color}15` : '#f9fafb',
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ color: active ? ct.color : '#9ca3af' }} />
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: active ? ct.color : '#6b7280' }}
                        >
                          {ct.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Content input based on type */}
              {form.content_type === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Matn <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.content_text}
                    onChange={e => setForm({ ...form, content_text: e.target.value })}
                    placeholder="Dars matni..."
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                </div>
              ) : form.content_type === 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Havola URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={form.content_url}
                    onChange={e => setForm({ ...form, content_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ) : form.content_type === 'video' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Video <span className="text-red-500">*</span>
                  </label>
                  {/* Video: both URL and file upload */}
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={form.content_url}
                      onChange={e => setForm({ ...form, content_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... yoki to'g'ridan URL"
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="text-xs text-gray-400">yoki fayl yuklang</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                    <FileUploadButton
                      accept={UPLOAD_ACCEPT['video']}
                      upload={upload}
                      fileInputRef={fileInputRef}
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              ) : (
                /* PDF, PPTX, Word, Excel — file upload primary, URL secondary */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {currentType.label} fayl <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <FileUploadButton
                      accept={UPLOAD_ACCEPT[form.content_type] ?? '*'}
                      upload={upload}
                      fileInputRef={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    {/* Show uploaded URL or manual URL input */}
                    {form.content_url && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-xs text-green-700 truncate flex-1">{upload.fileName || form.content_url}</span>
                        <button
                          type="button"
                          onClick={() => { setForm(f => ({ ...f, content_url: '' })); setUpload({ uploading: false, fileName: null }) }}
                          className="text-green-400 hover:text-red-400 transition-colors shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="text-xs text-gray-400">yoki URL kiriting</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                    <input
                      type="url"
                      value={form.content_url}
                      onChange={e => {
                        setForm({ ...form, content_url: e.target.value })
                        setUpload(u => ({ ...u, fileName: null }))
                      }}
                      placeholder="https://..."
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              )}

              {/* Duration + XP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Davomiylik (daqiqa)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.duration_minutes}
                    onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                    placeholder="30"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">XP mukofot</label>
                  <input
                    type="number"
                    min="0"
                    value={form.xp_reward}
                    onChange={e => setForm({ ...form, xp_reward: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-white transition-all"
              >
                Bekor
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
                style={{ backgroundColor: '#0B3D91' }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saqlanmoqda...' : editLesson ? 'Yangilash' : 'Qo\'shish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Fayl yuklash tugmasi ─────────────────────────────────────
function FileUploadButton({
  accept,
  upload,
  fileInputRef,
  onChange,
}: {
  accept: string
  upload: UploadState
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
        id="lesson-file-input"
      />
      <label
        htmlFor="lesson-file-input"
        className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all"
        style={{
          borderColor: upload.uploading ? '#0B3D91' : '#cbd5e1',
          backgroundColor: upload.uploading ? '#eff6ff' : '#f8fafc',
        }}
      >
        {upload.uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Yuklanmoqda...</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">
              Fayl tanlash yoki bu yerga tashlang
            </span>
          </>
        )}
      </label>
    </div>
  )
}
