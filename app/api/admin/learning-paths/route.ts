import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import { getAllLearningPaths, createLearningPath } from '@/lib/queries/learning-paths'

export async function GET() {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }
  try {
    const data = await getAllLearningPaths()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Learning paths GET error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }
  try {
    const body = await request.json()
    const { title, description, is_published } = body
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Nomi majburiy' }, { status: 400 })
    }
    const lp = await createLearningPath({
      title: title.trim(),
      description: description?.trim(),
      is_published: is_published ?? false,
      created_by: session!.id,
    })
    return NextResponse.json(lp, { status: 201 })
  } catch (error) {
    console.error('Learning path POST error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
