import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getTestByCourse, createQuestion } from '@/lib/queries/courses'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  if (!body.text?.trim()) return NextResponse.json({ error: 'Savol matni kiritilishi shart' }, { status: 400 })
  if (!body.type) return NextResponse.json({ error: 'Savol turi kiritilishi shart' }, { status: 400 })

  // Get or create test first
  let test = await getTestByCourse(id)
  if (!test) {
    // Auto-create test if missing
    const { upsertTest } = await import('@/lib/queries/courses')
    test = await upsertTest(id, { title: 'Test', passing_score: 70, max_attempts: 3 })
  }

  try {
    const question = await createQuestion(test.id, {
      text: body.text.trim(),
      type: body.type,
      options: body.options ?? [],
      correct_text: body.correct_text ?? null,
      points: body.points ? parseInt(body.points) : 1,
      explanation: body.explanation ?? null,
    })
    return NextResponse.json(question, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
