import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listUsers } from '@/lib/queries/users'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 20)
  const search = searchParams.get('search') ?? undefined
  const role = searchParams.get('role') ?? undefined
  const shop_id = searchParams.get('shop_id') ?? undefined

  const data = await listUsers({ page, limit, search, role, shop_id })
  return NextResponse.json(data)
}
