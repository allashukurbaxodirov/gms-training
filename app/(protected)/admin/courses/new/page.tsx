import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'
import { CourseForm } from '../CourseForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewCoursePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!ADMIN_ROLES.includes(session.role as Role)) redirect('/dashboard')

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Yangi kurs yaratish</h1>
      </div>
      <CourseForm />
    </div>
  )
}
