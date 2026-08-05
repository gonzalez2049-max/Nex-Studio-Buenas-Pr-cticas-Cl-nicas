import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/queries'
import { relativeDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NotificationType } from '@/types/database'

const ICON: Record<NotificationType, string> = {
  review_requested: 'ClipboardCheck',
  observation_added: 'MessageSquareWarning',
  approved: 'CircleCheck',
  published: 'Globe',
  assigned: 'UserPlus',
  expiring: 'Clock',
  system: 'Bell',
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const unread = data?.filter((n) => !n.read).length ?? 0

  return (
    <>
      <PageHeader
        title="Notificaciones"
        description="Avisos del flujo editorial: revisiones, observaciones, aprobaciones y publicaciones."
        actions={
          unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <Icon name="CheckCheck" className="h-4 w-4" />
              Marcar todas como leídas
            </Button>
          )
        }
      />
      <ConfigNotice />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <Card className="divide-y">
          {data.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.read) markRead.mutate({ id: n.id })
                if (n.link) navigate(n.link)
              }}
              className={cn(
                'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50',
                !n.read && 'bg-accent/40',
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  n.read
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/10 text-primary',
                )}
              >
                <Icon name={ICON[n.type] ?? 'Bell'} className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                {n.body && (
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  {relativeDate(n.created_at)}
                </p>
              </div>
            </button>
          ))}
        </Card>
      ) : (
        <EmptyState
          icon="BellOff"
          title="Sin notificaciones"
          description="Aquí verás los avisos del flujo editorial cuando ocurran."
        />
      )}
    </>
  )
}
