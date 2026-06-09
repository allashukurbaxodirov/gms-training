import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import { toggleLearningPathPublished, updateLearningPath } from '@/lib/queries/learning-paths'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await request.json()
    let row
    if (typeof body.is_published === 'boolean' && Object.keys(body).length === 1) {
      row = await toggleLearningPathPublished(id, body.is_published)
    } else {
      row = await updateLearningPath(id, body)
    }
    return NextResponse.json(row)
  } catch (error) {
    console.error('Learning path PATCH error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
