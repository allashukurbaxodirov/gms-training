'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ROLE_LABELS, ROLES } from '@/constants/roles'
import { Search, Users } from 'lucide-react'
import { PageLayout } from '@/components/ui/PageLayout'

interface User {
  id: string
  tab_number: string
  full_name: string
  login: string
  role: string
  is_active: boolean
  shop_name: string | null
  department_name: string | null
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string>('')
  const [page] = useState(1)

  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' })
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (role) params.set('role', role)
        const res = await fetch(`/api/users?${params}`)
        if (res.ok) {
          const data = await res.json()
          setUsers(data.rows ?? [])
          setTotal(data.total ?? 0)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [debouncedSearch, role, page])

  return (
    <PageLayout
      title="Foydalanuvchilar"
      description={`Jami: ${total} ta xodim`}
    >

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ism, login yoki tabel raqam..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={role} onValueChange={(val) => setRole(val ?? '')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Barcha rollar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Barcha rollar</SelectItem>
              {Object.entries(ROLES).map(([, val]) => (
                <SelectItem key={val} value={val}>{ROLE_LABELS[val]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground">Foydalanuvchi topilmadi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabel</TableHead>
                  <TableHead>Ism</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Bo&apos;lim</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.tab_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.login}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[user.role as import('@/constants/roles').Role] ?? user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.shop_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}
