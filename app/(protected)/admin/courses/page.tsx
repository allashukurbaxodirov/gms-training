import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { listCourses } from '@/lib/queries/courses'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { AdminCoursesTable } from './AdminCoursesTable'

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    difficulty?: string
    page?: string
    published?: string
    category?: string
  }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  const sp = await searchParams
  const page = parseInt(sp.page ?? '1')
  const search = sp.search
  const difficulty = sp.difficulty
  const category = sp.category
  const is_published = sp.published === 'true' ? true : sp.published === 'false' ? false : undefined

  let data = { rows: [] as Record<string, unknown>[], total: 0, page: 1, limit: 20 }
  try {
    data = (await listCourses({ page, limit: 20, search, difficulty, is_published, category })) as typeof data
  } catch {}

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kurslar boshqaruvi</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Trening matritsa: Functional · GM-GMS · Safety &amp; Environment · {data.total} ta kurs
        </p>
      </div>

      <AdminCoursesTable
        courses={data.rows}
        total={data.total}
        page={page}
        limit={20}
        search={search ?? ''}
        difficulty={difficulty ?? ''}
        published={sp.published ?? ''}
        category={category ?? ''}
      />
    </div>
  )
}
