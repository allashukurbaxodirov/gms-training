import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession, buildSessionCookie } from '@/lib/auth'
import { updateUserProfile, findUserById } from '@/lib/queries/users'

// PATCH /api/profile — profil yangilash
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { phone, avatar_url, language } = await request.json()
    await updateUserProfile(session.id, { phone, avatar_url, language })

    // Cookie ni yangilash (avatar_url, level, xp o'zgarishi mumkin)
    const user = await findUserById(session.id)
    if (user) {
      const updated = {
        ...session,
        avatar_url: user.avatar_url,
        xp_points: user.xp_points,
        level: user.level,
      }
      const cookieStore = await cookies()
      const cookie = await buildSessionCookie(updated)
      cookieStore.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        maxAge: cookie.maxAge,
        path: cookie.path,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
