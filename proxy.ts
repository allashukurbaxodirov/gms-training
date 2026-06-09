import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/verify']

// Next.js 16 — "proxy" konventsiyasi (middleware emas)
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const session = request.cookies.get('gms_session')?.value

  if (!isPublic && !session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Cookie mavjudligi yetarli emas — imzosini faqat server tomonida verify qilish mumkin.
  // Login sahifasidan yo'naltirish getSession() bilan qilinadi, bu yerda emas.

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
