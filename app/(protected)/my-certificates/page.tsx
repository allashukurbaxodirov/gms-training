import { getSession } from '@/lib/auth'
import { getMyCertificates } from '@/lib/queries/certificates'
import { Medal, CalendarCheck, BarChart2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { PageLayout } from '@/components/ui/PageLayout'

const difficultyLabel: Record<string, string> = {
  beginner: 'Boshlang\'ich',
  intermediate: 'O\'rta',
  advanced: 'Murakkab',
}

export default async function CertificatesPage() {
  const session = await getSession()
  if (!session) return null

  let certs: Record<string, unknown>[] = []
  try {
    certs = (await getMyCertificates(session.id)) as Record<string, unknown>[]
  } catch {}

  return (
    <PageLayout
      title="Sertifikatlarim"
      description="Tugatilgan kurslar uchun sertifikatlar"
      action={
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#0B3D91' }}
        >
          <Medal className="h-4 w-4" />
          {certs.length} ta sertifikat
        </div>
      }
    >

      {certs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-24 text-center">
          <Medal className="h-14 w-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Hozircha sertifikat yo&apos;q</p>
          <p className="text-sm text-gray-400 mt-1">Kursni tugatgandan so&apos;ng sertifikat beriladi</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map((cert) => (
            <CertCard key={cert.enrollment_id as string} cert={cert} userName={session.full_name} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}

function CertCard({ cert, userName }: { cert: Record<string, unknown>; userName: string }) {
  const completedAt = cert.completed_at
    ? format(new Date(cert.completed_at as string), 'dd.MM.yyyy')
    : '—'
  const score = cert.score ? `${Math.round(cert.score as number)}%` : '—'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Top gradient bar */}
      <div className="h-2" style={{ background: 'linear-gradient(90deg, #0B3D91, #FFB81C)' }} />

      <div className="p-5">
        {/* Icon + title */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#0B3D9115' }}
          >
            <Medal className="h-5 w-5" style={{ color: '#0B3D91' }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{cert.title as string}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {difficultyLabel[cert.difficulty as string] ?? cert.difficulty as string}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarCheck className="h-3.5 w-3.5 text-gray-300" />
            Tugatilgan: {completedAt}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <BarChart2 className="h-3.5 w-3.5 text-gray-300" />
            Ball: {score}
          </div>
        </div>

        {/* Student name */}
        <p className="text-xs text-gray-400 border-t border-gray-50 pt-3 mb-3">{userName}</p>

        {/* Download button */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          onClick={() => alert('Sertifikat yuklab olish — tez kunda qo\'shiladi')}
        >
          <Download className="h-3.5 w-3.5" />
          Yuklab olish (PDF)
        </button>
      </div>
    </div>
  )
}
