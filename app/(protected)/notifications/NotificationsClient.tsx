'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellDot, GraduationCap, CheckCheck, ChevronRight, Info, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export interface NotifItem {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  action_url: string | null
  created_at: string
}

interface Props {
  initialNotifications: NotifItem[]
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  course:  <GraduationCap className="h-4 w-4" />,
  info:    <Info className="h-4 w-4" />,
  warning: <AlertCircle className="h-4 w-4" />,
}

const TYPE_COLORS: Record<string, string> = {
  course:  '#0B3D91',
  info:    '#6366f1',
  warning: '#f59e0b',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Hozir'
  if (mins < 60) return `${mins} daqiqa oldin`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} kun oldin`
  return new Date(dateStr).toLocaleDateString('uz-UZ')
}

export function NotificationsClient({ initialNotifications }: Props) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotifItem[]>(initialNotifications)
  const [markingAll, setMarkingAll] = useState(false)

  const unreadCount = notifications.filter(n => !n.is_read).length

  async function handleMarkAll() {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('Barcha xabarnomalar o\'qildi')
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleClick(notif: NotifItem) {
    // Mark as read
    if (!notif.is_read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
      await fetch(`/api/notifications/${notif.id}`, { method: 'PATCH' }).catch(() => {})
    }
    // Navigate
    if (notif.action_url) router.push(notif.action_url)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xabarnomalar</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} ta o&apos;qilmagan</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[#0B3D91] bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4" />
            Barchasini o&apos;qildi deb belgilash
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <BellDot className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Xabarnomalar yo&apos;q</p>
          <p className="text-sm text-gray-400 mt-1">Yangi kurslar tayinlanganda bu yerda ko&apos;rinadi</p>
        </div>
      )}

      {/* Notification list */}
      <div className="space-y-2">
        {notifications.map(notif => {
          const color = TYPE_COLORS[notif.type] ?? '#6b7280'
          const icon = TYPE_ICONS[notif.type] ?? <BellDot className="h-4 w-4" />
          return (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`flex gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                notif.is_read
                  ? 'bg-white border-gray-100 hover:border-gray-200'
                  : 'bg-blue-50/60 border-blue-100 hover:border-blue-200'
              }`}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}18`, color }}
              >
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notif.title}
                  </p>
                  <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">
                    {timeAgo(notif.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{notif.message}</p>
                {notif.action_url && (
                  <span className="inline-flex items-center gap-0.5 text-[12px] font-medium mt-1.5" style={{ color }}>
                    Ko&apos;rish <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </div>

              {/* Unread dot */}
              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
