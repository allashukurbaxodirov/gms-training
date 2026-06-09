import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { Video, Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react'
import { PageLayout } from '@/components/ui/PageLayout'

function fmtDt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('uz-Latn-UZ', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function LiveSessionsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  let upcoming: Record<string, unknown>[] = []
  let past: Record<string, unknown>[] = []
  try {
    const rows = await sql`
      SELECT ls.id, ls.title, ls.description, ls.session_type, ls.meeting_url,
             ls.location, ls.scheduled_at, ls.duration_minutes, ls.max_participants,
             ls.is_cancelled, u.full_name AS trainer_name, c.title AS course_title
      FROM live_sessions ls
      LEFT JOIN users u ON u.id = ls.trainer_id
      LEFT JOIN courses c ON c.id = ls.course_id
      WHERE ls.is_cancelled = false
      ORDER BY ls.scheduled_at ASC NULLS LAST
    ` as unknown as Record<string, unknown>[]
    const now = new Date()
    upcoming = rows.filter((r) => !r.scheduled_at || new Date(r.scheduled_at as string) >= now)
    past = rows.filter((r) => r.scheduled_at && new Date(r.scheduled_at as string) < now)
  } catch {}

  const SESSION_TYPE: Record<string, { label: string; color: string }> = {
    online:  { label: 'Online',  color: '#0B3D91' },
    offline: { label: 'Offline', color: '#0f766e' },
    hybrid:  { label: 'Gibrid',  color: '#b45309' },
  }

  function SessionCard({ s }: { s: Record<string, unknown> }) {
    const type = SESSION_TYPE[s.session_type as string ?? 'online'] ?? SESSION_TYPE.online
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: type.color + '15' }}>
            <Video className="h-5 w-5" style={{ color: type.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-base leading-tight">{String(s.title)}</h3>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0" style={{ backgroundColor: type.color + '15', color: type.color }}>
                {type.label}
              </span>
            </div>
            {s.course_title ? (
              <p className="text-sm text-gray-500 mt-1">{String(s.course_title)}</p>
            ) : null}
            {s.description ? (
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{String(s.description)}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {s.scheduled_at ? (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {fmtDt(s.scheduled_at as string)}
                </span>
              ) : null}
              {s.duration_minutes ? (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {String(s.duration_minutes)} daqiqa
                </span>
              ) : null}
              {s.max_participants ? (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users className="h-4 w-4 text-gray-400" />
                  Max: {String(s.max_participants)} ishtirokchi
                </span>
              ) : null}
              {s.location ? (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {String(s.location)}
                </span>
              ) : null}
            </div>
            {s.trainer_name ? (
              <p className="text-sm text-gray-500 mt-2">
                <span className="text-gray-400">O&apos;qituvchi:</span> {String(s.trainer_name)}
              </p>
            ) : null}
          </div>
        </div>
        {s.meeting_url ? (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={String(s.meeting_url)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: type.color }}
            >
              <ExternalLink className="h-4 w-4" />
              Sessiyaga qo&apos;shilish
            </a>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <PageLayout
      title="Jonli sessiyalar"
      description="Rejalashtirilgan va o'tgan trening sessiyalari"
    >

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Rejalashtirilgan ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Video className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Rejalashtirilgan sessiyalar yo&apos;q</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcoming.map((s) => <SessionCard key={String(s.id)} s={s} />)}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
            O&apos;tgan sessiyalar ({past.length})
          </h2>
          <div className="grid gap-4 opacity-70">
            {past.map((s) => <SessionCard key={String(s.id)} s={s} />)}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
