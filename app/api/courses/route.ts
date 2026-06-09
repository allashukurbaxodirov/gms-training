import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { listCourses, createCourse } from '@/lib/queries/courses'

const CreateCourseSchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 ta belgi bo'lishi kerak"),
  description: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_minutes: z.number().int().positive().optional(),
  is_mandatory: z.boolean().optional(),
  passing_score: z.number().int().min(0).max(100).optional(),
  department_id: z.string().uuid().optional(),
})

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 20)
  const search = searchParams.get('search') ?? undefined
  const difficulty = searchParams.get('difficulty') ?? undefined
  const isPublishedParam = searchParams.get('is_published')
  const is_published = isPublishedParam === null ? undefined : isPublishedParam === 'true'

  const data = await listCourses({ page, limit, search, difficulty, is_published })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = CreateCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const course = await createCourse({ ...parsed.data, created_by: session.id })
  return NextResponse.json(course, { status: 201 })
}
