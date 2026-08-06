import { Icon } from '@/components/common/Icon'
import { StateBadge } from '@/components/common/StateBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRestoreVersion, useVersions } from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '@/contexts/AuthContext'
import { PERMISSIONS, type ProjectState } from '@/lib/domain'
import { shortDate, relativeDate } from '@/lib/format'

export function HistoryDialog({
  projectId,
  open,
  onOpenChange,
  canRestore = true,
}: {
  projectId: string
  open: boolean
  onOpenChange: (o: boolean) => void
  canRestore?: boolean
}) {
  const { toast } = useToast()
  const role = useRole()
  const { data: versions, isLoading } = useVersions(open ? projectId : undefined)
  const restore = useRestoreVersion(projectId)
  const allowRestore = canRestore && PERMISSIONS.canCreateMaterial(role)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de versiones</DialogTitle>
          <DialogDescription>
            Instantáneas guardadas del material. Puedes recuperar cualquiera.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          ) : versions && versions.length > 0 ? (
            versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Versión {v.version}
                    </span>
                    {v.status && (
                      <StateBadge status={v.status as ProjectState} />
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {v.note ?? 'Sin nota'} · {v.author?.full_name ?? 'Alguien'}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {shortDate(v.created_at)} · {relativeDate(v.created_at)}
                  </p>
                </div>
                {allowRestore && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={restore.isPending}
                    onClick={async () => {
                      await restore.mutateAsync(v)
                      toast({
                        variant: 'success',
                        title: `Versión ${v.version} restaurada`,
                      })
                    }}
                  >
                    <Icon name="History" className="h-4 w-4" />
                    Restaurar
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay versiones. Se crean al guardar en el editor o al cambiar
              de estado.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
