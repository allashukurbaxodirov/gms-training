import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersRound, Library, BarChart2, Swords } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  const quickLinks = [
    { href: '/admin/users', label: 'Foydalanuvchilar', icon: UsersRound, desc: "Xodimlarni boshqarish" },
    { href: '/admin/courses', label: 'Kurslar', icon: Library, desc: "Kurslar va darsliklar" },
    { href: '/admin/analytics', label: 'Analitika', icon: BarChart2, desc: "Statistika va hisobotlar" },
    { href: '/admin/gamification', label: 'Gamifikatsiya', icon: Swords, desc: "XP, badges, reyting" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">GMS Training boshqaruvi</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{link.label}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{link.desc}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
