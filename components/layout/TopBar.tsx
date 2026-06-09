'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { BellDot, LogOut, CircleUser, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function TopBar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?count=true')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count ?? 0)
      }
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  if (!user) return null

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 flex items-center justify-between px-6 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">GMS Training</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <BellDot className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                variant="destructive"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        {/* XP */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950 px-3 py-1 text-sm">
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            {user.xp_points ?? 0} XP
          </span>
          <span className="text-amber-500/60">·</span>
          <span className="text-amber-500 dark:text-amber-400">Lv.{user.level ?? 1}</span>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-accent transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {initials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium max-w-32 truncate">
              {user.full_name}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/profile')}
            >
              <CircleUser className="h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
