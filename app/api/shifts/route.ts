import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getShifts } from '@/lib/queries/courses'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await getShifts()
  return NextResponse.json(data)
}
