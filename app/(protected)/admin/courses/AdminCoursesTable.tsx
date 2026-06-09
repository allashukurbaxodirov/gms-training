'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { Search, Edit2, Trash2, Eye, EyeOff, Users, Megaphone, Plus } from 'lucide-react'
import { EnrollWizard } from './EnrollWizard'

interface Course {
  id: string
  title: string
  category: string | null
  difficulty: string
  is_published: boolean
  is_mandatory: boolean
  duration_minutes: number
  enrollment_count: number
  created_at: string
  creator_name: string | null
}

interface Props {
  courses: Record<string, unknown>[]
  total: number
  page: number
  limit: number
  search: string
  difficulty: string
  published: string
  category: string
}

const difficultyLabel: Record<string, string> = {
  beginner: "Boshlang'ich",
  intermediate: "O'rta",
  advanced: 'Murakkab',
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'Functional': { bg: '#dbeafe', text: '#1d4ed8', label: 'Functional' },
  'GM-GMS': { bg: '#dcfce7', text: '#15803d', label: 'GM-GMS' },
  'Safety & Environment': { bg: '#fef9c3', text: '#a16207', label: 'Safety' },
  'Safety&Environment': { bg: '#fef9c3', text: '#a16207', label: 'Safety' },
  'Others': { bg: '#f3e8ff', text: '#6b21a8', label: 'Others' },
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  const style = CATEGORY_STYLES[category] ?? { bg: '#f3f4f6', text: '#6b7280', label: category }
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}

export function AdminCoursesTable({
  courses: initial, total, page, limit,
  search: initSearch, difficulty: initDiff,
  published: initPub, category: initCat
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [courses, setCourses] = useState<Course[]>(initial as unknown as Course[])
  const [search, setSearch] = useState(initSearch)
  const [difficulty, setDifficulty] = useState(initDiff)
  const [published, setPublished] = useState(initPub)
  const [category, setCategory] = useState(initCat)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [enrollCourse, setEnrollCourse] = useState<{ id: string; title: string } | null>(null)
  const [showNewCourseForm, setShowNewCourseForm] = useState(false)

  function applyFilters(s: string, d: string, p: string, c: string) {
    const params = new URLSearchParams()
    if (s) params.set('search', s)
    if (d) params.set('difficulty', d)
    if (p) params.set('published', p)
    if (c) params.set('category', c)
    params.set('page', '1')
    router.push(`${pathname}?${params}`)
  }

  const handleSearch = useCallback((v: string) => {
    setSearch(v)
    applyFilters(v, difficulty, published, category)
  }, [difficulty, published, category]) // eslint-disable-line

  async function togglePublish(course: Course) {
    setToggling(course.id)
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !course.is_published }),
      })
      if (!res.ok) throw new Error()
      setCourses((prev) =>
        prev.map((c) => c.id === course.id ? { ...c, is_published: !c.is_published } : c)
      )
      toast.success(course.is_published ? 'Kurs yashirildi' : 'Kurs nashr etildi')
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setToggling(null)
    }
  }

  async function deleteCourse(id: string, title: string) {
    if (!confirm(`"${title}" kursini o'chirmoqchimisiz?`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCourses((prev) => prev.filter((c) => c.id !== id))
      toast.success("Kurs o'chirildi")
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setDeleting(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <>
      {enrollCourse && (
        <EnrollWizard
          courseId={enrollCourse.id}
          courseTitle={enrollCourse.title}
          onClose={() => setEnrollCourse(null)}
        />
      )}

      {showNewCourseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewCourseForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Yangi kurs yaratish</h2>
              <button
                onClick={() => setShowNewCourseForm(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
              >✕</button>
            </div>
            <div className="p-6">
              <NewCourseForm onSuccess={() => { setShowNewCourseForm(false); router.refresh() }} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Kurs nomini qidiring..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); applyFilters(search, difficulty, published, e.target.value) }}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white"
          >
            <option value="">Barcha kategoriya</option>
            <option value="Functional">Functional</option>
            <option value="GM-GMS">GM-GMS</option>
            <option value="Safety & Environment">Safety & Environment</option>
            <option value="Others">Others</option>
          </select>
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); applyFilters(search, e.target.value, published, category) }}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white"
          >
            <option value="">Barcha daraja</option>
            <option value="beginner">Boshlang&apos;ich</option>
            <option value="intermediate">O&apos;rta</option>
            <option value="advanced">Murakkab</option>
          </select>
          <select
            value={published}
            onChange={(e) => { setPublished(e.target.value); applyFilters(search, difficulty, e.target.value, category) }}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none bg-white"
          >
            <option value="">Barcha holat</option>
            <option value="true">Nashr etilgan</option>
            <option value="false">Qoralama</option>
          </select>
          <button
            onClick={() => setShowNewCourseForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white ml-auto"
            style={{ backgroundColor: '#0B3D91' }}
          >
            <Plus className="h-4 w-4" />
            Yangi kurs
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">№</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kurs nomi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Kategoriya</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Daraja</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Yozilganlar</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Holat</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courses.map((course, idx) => (
                <tr key={course.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-medium">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 line-clamp-1 text-sm">{course.title}</p>
                    {course.is_mandatory && (
                      <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded mr-1">
                        MAJBURIY
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <CategoryBadge category={course.category} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-500">{difficultyLabel[course.difficulty] ?? course.difficulty}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {course.enrollment_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(course)}
                      disabled={toggling === course.id}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                        course.is_published
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {course.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {course.is_published ? 'Nashr' : 'Qoralama'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEnrollCourse({ id: course.id, title: course.title })}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all"
                        title="E'lon qilish"
                      >
                        <Megaphone className="h-3 w-3" />
                        E&apos;lon
                      </button>
                      <a
                        href={`/admin/courses/${course.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0B3D91] hover:bg-blue-50 transition-all"
                        title="Tahrirlash"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => deleteCourse(course.id, course.title)}
                        disabled={deleting === course.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                        title="O'chirish"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400 text-sm">
                    Kurslar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {total} ta kursdan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} ko&apos;rsatilmoqda
              </p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                  .map((p) => (
                    <a
                      key={p}
                      href={`${pathname}?search=${search}&difficulty=${difficulty}&published=${published}&category=${category}&page=${p}`}
                      className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium transition-all ${
                        p === page ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      style={p === page ? { backgroundColor: '#0B3D91' } : undefined}
                    >
                      {p}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Inline new course form ───────────────────────────────────
function NewCourseForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Functional',
    difficulty: 'beginner',
    duration_minutes: 60,
    is_mandatory: false,
    passing_score: 70,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Kurs nomi kiritilishi shart'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Xatolik yuz berdi')
        return
      }
      const d = await res.json()
      toast.success('Kurs yaratildi')
      // Navigate to the editor
      window.location.href = `/admin/courses/${d.id}`
    } catch {
      toast.error("Server bilan aloqa yo'q")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kurs nomi *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="Masalan: GMS Audit standartlari"
          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] bg-white"
          >
            <option value="Functional">Functional</option>
            <option value="GM-GMS">GM-GMS</option>
            <option value="Safety & Environment">Safety &amp; Environment</option>
            <option value="Others">Others</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daraja</label>
          <select
            value={form.difficulty}
            onChange={e => setForm({ ...form, difficulty: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0B3D91] bg-white"
          >
            <option value="beginner">Boshlang&apos;ich</option>
            <option value="intermediate">O&apos;rta</option>
            <option value="advanced">Murakkab</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ backgroundColor: '#0B3D91' }}
        >
          {saving ? 'Yaratilmoqda...' : 'Yaratish va tahrirlash →'}
        </button>
      </div>
    </form>
  )
}
