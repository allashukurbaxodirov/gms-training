import { NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import { getTrainingMatrixData } from '@/lib/queries/training-matrix'

export async function GET() {
  const session = await getSession()
  if (!requireRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }
  try {
    const data = await getTrainingMatrixData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Training matrix error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
