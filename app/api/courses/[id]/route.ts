import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCourseById } from '@/lib/queries/courses'
import sql from '@/lib/db'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const course = await getCourseById(id, session.id)
  if (!course) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })

  return NextResponse.json(course)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const [course] = await sql`
    UPDATE courses SET
      title = COALESCE(${body.title ?? null}, title),
      description = COALESCE(${body.description ?? null}, description),
      difficulty = COALESCE(${body.difficulty ?? null}, difficulty),
      duration_minutes = COALESCE(${body.duration_minutes ?? null}, duration_minutes),
      is_mandatory = COALESCE(${body.is_mandatory ?? null}, is_mandatory),
      passing_score = COALESCE(${body.passing_score ?? null}, passing_score),
      "updatedAt" = NOW()
    WHERE id = ${id}::uuid
    RETURNING *
  `
  if (!course) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })

  return NextResponse.json(course)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM courses WHERE id = ${id}::uuid`
  return NextResponse.json({ ok: true })
}
