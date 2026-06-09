import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session) {
    const isAdmin = ADMIN_ROLES.includes(session.role as Role)
    redirect(isAdmin ? '/admin' : '/dashboard')
  }
  return <>{children}</>
}
