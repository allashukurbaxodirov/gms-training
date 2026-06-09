import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLessons, createLesson } from '@/lib/queries/courses'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const lessons = await getLessons(id)
  return NextResponse.json(lessons)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  if (!body.title?.trim()) return NextResponse.json({ error: 'Dars nomi kiritilishi shart' }, { status: 400 })
  if (!body.content_type) return NextResponse.json({ error: 'Kontent turi kiritilishi shart' }, { status: 400 })

  try {
    const lesson = await createLesson(id, {
      title: body.title.trim(),
      content_type: body.content_type,
      content_url: body.content_url ?? null,
      content_text: body.content_text ?? null,
      duration_minutes: body.duration_minutes ? parseInt(body.duration_minutes) : null,
      xp_reward: body.xp_reward ? parseInt(body.xp_reward) : 10,
      is_required: body.is_required ?? true,
    })
    return NextResponse.json(lesson, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
