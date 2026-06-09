import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { updateLesson, deleteLesson } from '@/lib/queries/courses'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; lid: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { lid } = await params
  const body = await request.json()

  try {
    await updateLesson(lid, {
      title: body.title,
      content_type: body.content_type,
      content_url: body.content_url,
      content_text: body.content_text,
      duration_minutes: body.duration_minutes,
      xp_reward: body.xp_reward,
      is_required: body.is_required,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; lid: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { lid } = await params
  try {
    await deleteLesson(lid)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
