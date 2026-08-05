import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Icon } from '@/components/common/Icon'
import {
  useAddObservation,
  useObservations,
  useResolveObservation,
} from '@/hooks/queries'
import { useRole } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/lib/domain'
import { relativeDate } from '@/lib/format'
import { initials } from '@/lib/utils'

export function ObservationsPanel({ projectId }: { projectId: string }) {
  const role = useRole()
  const { data: observations, isLoading } = useObservations(projectId)
  const add = useAddObservation(projectId)
  const resolve = useResolveObservation(projectId)
  const [body, setBody] = React.useState('')

  const canReview = PERMISSIONS.canReview(role)

  return (
    <div className="space-y-4">
      {canReview && (
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribe una observación de revisión…"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!body.trim() || add.isPending}
              onClick={async () => {
                await add.mutateAsync(body.trim())
                setBody('')
              }}
            >
              <Icon name="MessageSquarePlus" className="h-4 w-4" />
              Añadir observación
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando observaciones…</p>
      ) : observations && observations.length > 0 ? (
        <ul className="space-y-3">
          {observations.map((o) => (
            <li
              key={o.id}
              className="flex gap-3 rounded-lg border bg-card p-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={o.author?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {initials(o.author?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {o.author?.full_name ?? 'Revisor'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {relativeDate(o.created_at)}
                  </span>
                </div>
                <p
                  className={
                    o.resolved
                      ? 'text-sm text-muted-foreground line-through'
                      : 'text-sm'
                  }
                >
                  {o.body}
                </p>
                <button
                  onClick={() =>
                    resolve.mutate({ id: o.id, resolved: !o.resolved })
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Icon
                    name={o.resolved ? 'RotateCcw' : 'Check'}
                    className="h-3 w-3"
                  />
                  {o.resolved ? 'Reabrir' : 'Marcar resuelta'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          Sin observaciones todavía.
        </p>
      )}
    </div>
  )
}
