import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getSession, buildSessionCookie, clearSessionCookie } from '@/lib/auth'
import { findUserByLogin, updateUserLastLogin } from '@/lib/queries/users'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

// Simple in-memory rate limiter: 5 attempts per IP per 15 min
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 15 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// GET /api/auth — joriy session (me)
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ user: session })
}

// POST /api/auth — login
export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Juda ko\'p urinish. 15 daqiqadan so\'ng qayta urining.' }, { status: 429 })
    }

    const { login, password } = await request.json()

    if (!login || !password) {
      return NextResponse.json({ error: 'Login va parol kiritilishi shart' }, { status: 400 })
    }

    const user = await findUserByLogin(login.trim())

    if (!user) {
      return NextResponse.json({ error: "Login yoki parol noto'g'ri" }, { status: 401 })
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash)
    if (!passwordValid) {
      return NextResponse.json({ error: "Login yoki parol noto'g'ri" }, { status: 401 })
    }

    await updateUserLastLogin(user.id)

    const session = {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      tab_number: user.tab_number,
      login: user.login,
      avatar_url: user.avatar_url,
      xp_points: user.xp_points,
      level: user.level,
      streak_days: user.streak_days,
    }

    const cookieStore = await cookies()
    const cookie = await buildSessionCookie(session)
    cookieStore.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge,
      path: cookie.path,
    })

    // Role asosida yo'naltirish manzili
    const role = user.role as Role
    const redirect = ADMIN_ROLES.includes(role) ? '/admin' : '/'

    return NextResponse.json({ ok: true, redirect, user: session })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// DELETE /api/auth — logout
export async function DELETE() {
  const cookieStore = await cookies()
  const cookie = clearSessionCookie()
  cookieStore.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    maxAge: cookie.maxAge,
    path: cookie.path,
  })
  return NextResponse.json({ ok: true })
}
