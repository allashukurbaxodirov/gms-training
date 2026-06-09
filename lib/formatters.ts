import { format, parseISO, isValid } from 'date-fns'
import { uz } from 'date-fns/locale'
import { ROLE_LABELS, type Role } from '@/constants/roles'

export function formatDate(date: string | Date | null | undefined, pattern = 'dd.MM.yyyy'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, pattern, { locale: uz })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd.MM.yyyy HH:mm')
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '0'
  return new Intl.NumberFormat('uz-UZ').format(n)
}

export function truncate(str: string, maxLength = 80): string {
  if (!str) return ''
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as Role] ?? role
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
