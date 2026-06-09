import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getTestByCourse, upsertTest, getQuestions } from '@/lib/queries/courses'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const test = await getTestByCourse(id)
  if (!test) return NextResponse.json(null)

  const questions = await getQuestions(test.id)
  return NextResponse.json({ ...test, questions })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  if (!body.title?.trim()) return NextResponse.json({ error: 'Test nomi kiritilishi shart' }, { status: 400 })

  try {
    const test = await upsertTest(id, {
      title: body.title.trim(),
      description: body.description ?? null,
      time_limit_minutes: body.time_limit_minutes ? parseInt(body.time_limit_minutes) : null,
      passing_score: body.passing_score ? parseInt(body.passing_score) : 70,
      max_attempts: body.max_attempts ? parseInt(body.max_attempts) : 3,
      shuffle_questions: body.shuffle_questions ?? false,
      xp_reward: body.xp_reward ? parseInt(body.xp_reward) : 50,
    })
    return NextResponse.json(test)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
