import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'

export function relativeDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es })
  } catch {
    return '—'
  }
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso), "d 'de' MMM, yyyy", { locale: es })
  } catch {
    return '—'
  }
}
