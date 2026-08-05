import { cn } from '@/lib/utils'
import { STATE_BADGE, STATE_LABELS, type ProjectState } from '@/lib/domain'

export function StateBadge({
  status,
  className,
}: {
  status: ProjectState
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATE_BADGE[status],
        className,
      )}
    >
      {STATE_LABELS[status]}
    </span>
  )
}
