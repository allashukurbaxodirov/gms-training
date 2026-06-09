import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AuthProvider } from '@/contexts/auth-context'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <AuthProvider initialUser={session}>
      {/* Top navbar */}
      <Navbar />
      {/* Left sidebar */}
      <Sidebar />
      {/* Main content */}
      <main
        className="lg:pl-56 min-h-screen"
        style={{ backgroundColor: '#f0f4f8', paddingTop: '56px' }}
      >
        <div className="p-5 max-w-[1400px]">
          {children}
        </div>
      </main>
    </AuthProvider>
  )
}
