import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS, type Role } from '@/lib/domain'

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {ROLE_LABELS[role]}
    </Badge>
  )
}
