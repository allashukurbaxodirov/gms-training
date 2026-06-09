import { getSession } from '@/lib/auth'
import { getLeaderboard } from '@/lib/queries/leaderboard'
import { Trophy, Flame, Sparkles, Medal } from 'lucide-react'
import { initials } from '@/lib/formatters'
import { PageLayout } from '@/components/ui/PageLayout'

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session) return null

  let board: Record<string, unknown>[] = []
  try {
    board = (await getLeaderboard(50)) as Record<string, unknown>[]
  } catch {}

  const myRank = board.findIndex((u) => u.id === session.id) + 1

  return (
    <PageLayout
      title="Reyting jadvali"
      description="XP ball bo'yicha top 50 xodim"
      action={myRank > 0 ? (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-center">
          <p className="text-2xl font-bold" style={{ color: '#0B3D91' }}>#{myRank}</p>
          <p className="text-xs text-gray-400">Mening o&apos;rnim</p>
        </div>
      ) : undefined}
    >

      {/* Top 3 podium */}
      {board.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[board[1], board[0], board[2]].map((u, podiumIdx) => {
            if (!u) return null
            const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3
            const heights = ['h-24', 'h-32', 'h-20']
            const colors = ['#C0C0C0', '#FFB81C', '#CD7F32']
            const medalIcons = [
              <Medal key="silver" className="h-7 w-7" style={{ color: '#C0C0C0' }} />,
              <Trophy key="gold" className="h-7 w-7" style={{ color: '#FFB81C' }} />,
              <Medal key="bronze" className="h-7 w-7" style={{ color: '#CD7F32' }} />,
            ]
            return (
              <div key={u.id as string} className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: '#0B3D91' }}
                >
                  {initials(u.full_name as string)}
                </div>
                <p className="text-sm font-semibold text-gray-900 text-center line-clamp-1 max-w-[5rem]">{u.full_name as string}</p>
                <p className="text-xs text-gray-400">{u.xp_points as number} XP</p>
                <div
                  className={`w-full ${heights[podiumIdx]} rounded-t-lg flex items-center justify-center`}
                  style={{ backgroundColor: colors[podiumIdx] + '25', borderTop: `3px solid ${colors[podiumIdx]}` }}
                >
                  {medalIcons[podiumIdx]}
                </div>
                <p className="text-xs font-bold text-gray-500">#{rank}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Trophy className="h-4 w-4" style={{ color: '#FFB81C' }} />
          <h3 className="font-semibold text-gray-900">To&apos;liq jadval</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Xodim</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Ish joyi</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">XP</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Daraja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {board.map((u) => {
              const isMe = u.id === session.id
              const rank = u.rank as number
              return (
                <tr
                  key={u.id as string}
                  className={`transition-colors ${isMe ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3 text-sm font-bold text-gray-400 w-12">
                    {rank === 1 ? (
                      <Trophy className="h-5 w-5 mx-auto" style={{ color: '#FFB81C' }} />
                    ) : rank === 2 ? (
                      <Medal className="h-5 w-5 mx-auto" style={{ color: '#C0C0C0' }} />
                    ) : rank === 3 ? (
                      <Medal className="h-5 w-5 mx-auto" style={{ color: '#CD7F32' }} />
                    ) : `#${rank}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: isMe ? '#FFB81C' : '#0B3D91' }}
                      >
                        {initials(u.full_name as string)}
                      </div>
                      <div>
                        <p className={`font-medium ${isMe ? 'text-[#0B3D91]' : 'text-gray-900'}`}>
                          {u.full_name as string}
                          {isMe && <span className="ml-1.5 text-xs text-blue-400">(siz)</span>}
                        </p>
                        {(u.streak_days as number) > 0 && (
                          <p className="text-xs text-orange-400 flex items-center gap-0.5">
                            <Flame className="h-2.5 w-2.5" />
                            {u.streak_days as number} kun streak
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">
                    {(u.shop_name as string) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1 font-semibold" style={{ color: '#FFB81C' }}>
                      <Sparkles className="h-3.5 w-3.5" />
                      {u.xp_points as number}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-medium text-gray-500 hidden sm:table-cell">
                    Lv.{u.level as number}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {board.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">
            Hozircha ma&apos;lumot yo&apos;q
          </div>
        )}
      </div>
    </PageLayout>
  )
}
