'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle, Circle, Play, FileText, Link2, ChevronRight,
  Download, Presentation, BookOpen, Table, Video, ExternalLink, FolderOpen
} from 'lucide-react'

export interface Lesson {
  id: string
  title: string
  content_type: string
  content_url?: string | null
  content_text?: string | null
  duration_minutes: number
  order_index: number
  is_required: boolean
  xp_reward: number
}

interface LessonViewerProps {
  lessons: Lesson[]
  enrollmentId: string | null
  initialProgress: number
  courseId: string
  /** Test mavjud bo'lsa true — progress 90% da to'xtatiladi */
  hasTest?: boolean
  /** Barcha darslar bajarilganda chaqiriladi */
  onAllLessonsDone?: () => void
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video:  <Play className="h-4 w-4" />,
  pdf:    <FileText className="h-4 w-4" />,
  text:   <FileText className="h-4 w-4" />,
  link:   <Link2 className="h-4 w-4" />,
  pptx:   <Presentation className="h-4 w-4" />,
  word:   <BookOpen className="h-4 w-4" />,
  excel:  <Table className="h-4 w-4" />,
}

const TYPE_LABELS: Record<string, string> = {
  video: 'Video dars',
  pdf: 'PDF hujjat',
  text: 'Matn',
  link: 'Havola',
  pptx: 'Taqdimot (PPTX)',
  word: 'Word hujjat',
  excel: 'Excel jadval',
}

const TYPE_COLORS: Record<string, string> = {
  video:  '#ef4444',
  pdf:    '#f59e0b',
  text:   '#6366f1',
  link:   '#8b5cf6',
  pptx:   '#10b981',
  word:   '#3b82f6',
  excel:  '#22c55e',
}

function isYouTubeUrl(url: string) {
  return /youtube\.com|youtu\.be/.test(url)
}

function getYouTubeEmbedUrl(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function isLocalFile(url: string) {
  return url.startsWith('/uploads/')
}

export function LessonViewer({
  lessons, enrollmentId, initialProgress, hasTest, onAllLessonsDone,
}: LessonViewerProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  // Oldingi progressdan qaysi darslar bajarilgani
  const initCompleted = () => {
    const s = new Set<number>()
    // Darslar uchun max progress: test bo'lsa 90%, yo'q bo'lsa 100%
    const maxP = hasTest ? 90 : 100
    const doneCount = Math.min(
      lessons.length,
      Math.round((Math.min(initialProgress, maxP) / maxP) * lessons.length)
    )
    for (let i = 0; i < doneCount; i++) s.add(i)
    return s
  }

  const [completed, setCompleted] = useState<Set<number>>(initCompleted)
  const [saving, setSaving] = useState(false)

  const active = lessons[activeIdx]

  async function markDone(idx: number) {
    if (completed.has(idx)) return
    const next = new Set(completed).add(idx)
    setCompleted(next)

    const allDone = next.size >= lessons.length

    // Barcha darslar tugaganda signal ber
    if (allDone) {
      onAllLessonsDone?.()
    }

    if (!enrollmentId) return

    // Test mavjud bo'lsa progress 90% dan oshmasin (100% faqat test o'tgandan keyin)
    const rawPercent = Math.round((next.size / lessons.length) * 100)
    const percent = hasTest ? Math.min(rawPercent, 90) : rawPercent

    if (percent <= initialProgress) return

    setSaving(true)
    try {
      await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_percent: percent }),
      })
      // Test bo'lmasa — darslar tugatilsa kurs tugaydi
      if (!hasTest && allDone) toast.success('Kurs tugatildi! 🎉')
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  function renderContent(lesson: Lesson) {
    const url = lesson.content_url ?? ''
    const color = TYPE_COLORS[lesson.content_type] ?? '#6b7280'

    switch (lesson.content_type) {
      case 'video':
        if (!url) return <EmptyContent />
        if (isYouTubeUrl(url)) {
          const embedUrl = getYouTubeEmbedUrl(url)
          return embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full rounded-lg border-0"
              style={{ height: '60vh' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
              onLoad={() => {}}
            />
          ) : (
            <DownloadCard url={url} label="Videoni ochish" color={color} icon={<Video className="h-8 w-8" />} onView={() => markDone(activeIdx)} />
          )
        }
        return (
          <video
            src={url}
            controls
            className="w-full rounded-lg max-h-[60vh] bg-black"
            onEnded={() => markDone(activeIdx)}
          />
        )

      case 'pdf':
        if (!url) return <EmptyContent />
        return (
          <iframe
            src={url}
            className="w-full rounded-lg border border-gray-200"
            style={{ height: '70vh' }}
            title={lesson.title}
          />
        )

      case 'pptx':
        if (!url) return <EmptyContent />
        if (isLocalFile(url)) {
          return (
            <OfficeCard
              url={url}
              label="Taqdimot"
              scheme="ms-powerpoint"
              color={color}
              icon={<Presentation className="h-8 w-8" />}
              onView={() => markDone(activeIdx)}
            />
          )
        }
        // External PPTX — embed via Office Online
        return (
          <div className="space-y-3">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '70vh' }}
              title={lesson.title}
            />
            <div className="flex justify-end">
              <a href={url} target="_blank" rel="noopener noreferrer"
                onClick={() => markDone(activeIdx)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B3D91] transition-colors">
                <ExternalLink className="h-3.5 w-3.5" /> To'liq ekranda ochish
              </a>
            </div>
          </div>
        )

      case 'word':
        if (!url) return <EmptyContent />
        if (isLocalFile(url)) {
          return (
            <OfficeCard
              url={url}
              label="Word hujjat"
              scheme="ms-word"
              color={color}
              icon={<BookOpen className="h-8 w-8" />}
              onView={() => markDone(activeIdx)}
            />
          )
        }
        return (
          <div className="space-y-3">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '70vh' }}
              title={lesson.title}
            />
          </div>
        )

      case 'excel':
        if (!url) return <EmptyContent />
        if (isLocalFile(url)) {
          return (
            <OfficeCard
              url={url}
              label="Excel jadval"
              scheme="ms-excel"
              color={color}
              icon={<Table className="h-8 w-8" />}
              onView={() => markDone(activeIdx)}
            />
          )
        }
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            className="w-full rounded-lg border border-gray-200"
            style={{ height: '70vh' }}
            title={lesson.title}
          />
        )

      case 'link':
        if (!url) return <EmptyContent />
        return (
          <div className="flex flex-col items-center justify-center py-16 gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Link2 className="h-8 w-8" style={{ color }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800 mb-1">{lesson.title}</p>
              <p className="text-sm text-gray-500 max-w-md break-all">{url}</p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all"
              style={{ backgroundColor: '#0B3D91' }}
              onClick={() => markDone(activeIdx)}
            >
              <ExternalLink className="h-4 w-4" />
              Havolani ochish
            </a>
          </div>
        )

      case 'text':
      default:
        return (
          <div
            className="prose max-w-none text-gray-800 leading-relaxed min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: lesson.content_text ?? '<p>Kontent mavjud emas</p>' }}
          />
        )
    }
  }

  if (!active) return <div className="py-20 text-center text-gray-400">Darslar mavjud emas</div>

  return (
    <div className="flex gap-4 flex-col lg:flex-row">
      {/* Lesson list sidebar */}
      <aside className="lg:w-64 shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Darslar · {lessons.length} ta
            </p>
          </div>
          <nav className="p-1">
            {lessons.map((lesson, idx) => {
              const isActive = idx === activeIdx
              const isDone = completed.has(idx)
              const color = TYPE_COLORS[lesson.content_type] ?? '#6b7280'
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                    isActive ? 'bg-blue-50 text-[#0B3D91] font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`shrink-0 ${isDone ? 'text-green-500' : isActive ? 'text-[#0B3D91]' : 'text-gray-300'}`}>
                    {isDone ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </span>
                  <span className="flex-1 line-clamp-2 text-xs leading-tight">{lesson.title}</span>
                  <span className="shrink-0 opacity-60" style={{ color: isActive ? color : undefined }}>
                    {TYPE_ICONS[lesson.content_type] ?? <Circle className="h-3 w-3" />}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${TYPE_COLORS[active.content_type] ?? '#6b7280'}15`,
                    color: TYPE_COLORS[active.content_type] ?? '#6b7280',
                  }}
                >
                  {TYPE_LABELS[active.content_type] ?? active.content_type}
                </span>
                <span className="text-xs text-gray-400">{activeIdx + 1} / {lessons.length}</span>
              </div>
              <h2 className="font-semibold text-gray-900 truncate">{active.title}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {saving && <span className="text-xs text-gray-400 animate-pulse">Saqlanmoqda...</span>}
              <button
                onClick={() => {
                  markDone(activeIdx)
                  if (activeIdx < lessons.length - 1) setActiveIdx(prev => prev + 1)
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: completed.has(activeIdx) ? '#10b981' : '#0B3D91' }}
              >
                {completed.has(activeIdx) ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    {activeIdx < lessons.length - 1 ? 'Keyingi' : 'Tugatish'}
                  </>
                ) : (
                  <>
                    Bajarildi
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {renderContent(active)}
          </div>

          {/* XP reward footer */}
          {active.xp_reward > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
              <span>Bu darsni bajarish uchun: <span className="font-semibold text-[#FFB81C]">+{active.xp_reward} XP</span></span>
              {active.duration_minutes > 0 && <span>~{active.duration_minutes} daqiqa</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Yuklab olish kartochkasi ─────────────────────────────────
function DownloadCard({
  url, label, color, icon, onView, downloadName
}: {
  url: string
  label: string
  color: string
  icon: React.ReactNode
  onView?: () => void
  downloadName?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm"
        style={{ backgroundColor: `${color}15` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-center">
        <p className="font-medium text-gray-700 text-sm">{label}</p>
        {downloadName && (
          <p className="text-xs text-gray-400 mt-0.5 max-w-xs break-all">{decodeURIComponent(downloadName)}</p>
        )}
      </div>
      <a
        href={url}
        download={downloadName}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onView}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
        style={{ backgroundColor: color }}
      >
        <Download className="h-4 w-4" />
        {label}
      </a>
    </div>
  )
}

// ─── Office fayl kartochkasi (PPTX / Word / Excel) ───────────
// ms-powerpoint:ofe|u|<url> → PowerPoint'da to'g'ridan-to'g'ri ochiladi
// ms-word:ofe|u|<url>       → Word'da ochiladi
// ms-excel:ofe|u|<url>      → Excel'da ochiladi
function OfficeCard({
  url, label, scheme, color, icon, onView,
}: {
  url: string
  label: string
  scheme: 'ms-powerpoint' | 'ms-word' | 'ms-excel'
  color: string
  icon: React.ReactNode
  onView?: () => void
}) {
  const fileName = decodeURIComponent(url.split('/').pop() ?? '')

  function openWithOffice() {
    // Full URL kerak (ms-office scheme nisbiy URLni qabul qilmaydi)
    const fullUrl = `${window.location.origin}${url}`
    window.location.href = `${scheme}:ofe|u|${fullUrl}`
    onView?.()
  }

  return (
    <div className="flex flex-col items-center justify-center py-14 gap-5">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm"
        style={{ backgroundColor: `${color}15` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>

      <div className="text-center">
        <p className="font-semibold text-gray-800 text-base">{label}</p>
        {fileName && (
          <p className="text-xs text-gray-400 mt-1 max-w-xs break-all">{fileName}</p>
        )}
      </div>

      {/* Asosiy tugma: Microsoft Office'da ochish */}
      <button
        onClick={openWithOffice}
        className="flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 shadow-sm"
        style={{ backgroundColor: color }}
      >
        <FolderOpen className="h-4 w-4" />
        {label === 'Taqdimot' ? 'PowerPoint'
          : label === 'Word hujjat' ? 'Word'
          : 'Excel'}'da ochish
      </button>

      {/* Ikkinchi darajali: yuklab olish */}
      <a
        href={url}
        download={fileName}
        onClick={onView}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Yuklab olish
      </a>

      <p className="text-xs text-gray-400 max-w-xs text-center leading-relaxed">
        Ochilmasa — kompyuteringizda Microsoft Office o'rnatilganini tekshiring
      </p>
    </div>
  )
}

function EmptyContent() {
  return (
    <div className="py-20 text-center text-gray-400 text-sm">
      Kontent hali qo&apos;shilmagan
    </div>
  )
}
