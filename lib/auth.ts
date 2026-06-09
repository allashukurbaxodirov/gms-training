import { cookies } from 'next/headers'

export interface Session {
  id: string
  role: string
  full_name: string
  tab_number: string
  login: string
  avatar_url?: string | null
  xp_points?: number
  level?: number
  streak_days?: number
}

const COOKIE_NAME = 'gms_session'
const MAX_AGE = 60 * 60 * 8 // 8 soat

// HMAC-SHA256 signing via WebCrypto (Edge/Node compatible)
async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET ?? 'dev-secret-change-in-production'
  const enc = new TextEncoder()
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

async function sign(payload: string): Promise<string> {
  const key = await getKey()
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return `${Buffer.from(payload).toString('base64url')}.${sigB64}`
}

async function verify(token: string): Promise<string | null> {
  const dot = token.indexOf('.')
  if (dot === -1) return null
  const payloadB64 = token.slice(0, dot)
  const sigB64 = token.slice(dot + 1)
  try {
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const key = await getKey()
    const enc = new TextEncoder()
    const sig = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(payload))
    return valid ? payload : null
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    const payload = await verify(raw)
    if (!payload) return null
    return JSON.parse(payload) as Session
  } catch {
    return null
  }
}

export async function buildSessionCookie(session: Session) {
  const value = await sign(JSON.stringify(session))
  return {
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
    path: '/',
  }
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}

// Role guard helper for API routes
export function requireRole(session: Session | null, roles: string[]): boolean {
  if (!session) return false
  return roles.includes(session.role)
}
