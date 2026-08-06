import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/common/Icon'
import { useProfiles, useTransitionProject } from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '@/contexts/AuthContext'
import {
  PERMISSIONS,
  STATE_TRANSITIONS,
  transitionLabel,
  type ProjectState,
} from '@/lib/domain'
import type { Project } from '@/types/database'

/** Qué permiso se requiere para ejecutar cada transición destino. */
function canDoTransition(
  role: ReturnType<typeof useRole>,
  to: ProjectState,
): boolean {
  if (to === 'aprobado') return PERMISSIONS.canApprove(role)
  if (to === 'con_observaciones') return PERMISSIONS.canReview(role)
  if (to === 'publicado') return PERMISSIONS.canPublish(role)
  // Enviar a revisión, corregir, editar, archivar: creadores/coordinadores/admin.
  if (['pendiente_revision', 'en_edicion', 'borrador'].includes(to))
    return PERMISSIONS.canCreateMaterial(role)
  if (to === 'archivado')
    return (
      PERMISSIONS.canCreateMaterial(role) ||
      PERMISSIONS.canApprove(role) ||
      PERMISSIONS.canReview(role)
    )
  return PERMISSIONS.canApprove(role)
}

export function WorkflowBar({ project }: { project: Project }) {
  const role = useRole()
  const { toast } = useToast()
  const transition = useTransitionProject()
  const { data: profiles } = useProfiles()
  const [reviewDialog, setReviewDialog] = React.useState(false)
  const [reviewerId, setReviewerId] = React.useState<string>('')
  const [observationDialog, setObservationDialog] = React.useState(false)
  const [rejectDialog, setRejectDialog] = React.useState(false)
  const [note, setNote] = React.useState('')

  // La revisión está integrada en el Coordinador.
  const reviewers = React.useMemo(
    () => (profiles ?? []).filter((p) => p.role === 'coordinador'),
    [profiles],
  )

  const targets = (STATE_TRANSITIONS[project.status] ?? []).filter((to) =>
    canDoTransition(role, to),
  )

  const run = async (to: ProjectState, extra?: { reviewerId?: string; note?: string }) => {
    try {
      await transition.mutateAsync({
        project,
        to,
        reviewerId: extra?.reviewerId,
        note: extra?.note,
      })
      toast({
        variant: 'success',
        title: 'Estado actualizado',
        description: transitionLabel(project.status, to),
      })
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'No se pudo actualizar',
        description: e instanceof Error ? e.message : 'Error desconocido',
      })
    }
  }

  const handleClick = (to: ProjectState) => {
    if (to === 'pendiente_revision') {
      setReviewDialog(true)
      return
    }
    if (to === 'con_observaciones') {
      setObservationDialog(true)
      return
    }
    // Rechazo desde revisión exige justificación.
    if (to === 'archivado' && project.status === 'pendiente_revision') {
      setRejectDialog(true)
      return
    }
    void run(to)
  }

  if (targets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay acciones de flujo disponibles para tu rol en este estado.
      </p>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {targets.map((to) => {
          const primary = ['pendiente_revision', 'aprobado', 'publicado'].includes(to)
          const danger = to === 'archivado' && project.status === 'pendiente_revision'
          return (
            <Button
              key={to}
              variant={danger ? 'destructive' : primary ? 'default' : 'outline'}
              size="sm"
              disabled={transition.isPending}
              onClick={() => handleClick(to)}
            >
              {transitionLabel(project.status, to)}
            </Button>
          )
        })}
      </div>

      {/* Diálogo: enviar a revisión */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar a revisión</DialogTitle>
            <DialogDescription>
              Asigna un coordinador. Recibirá una notificación con el material.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Coordinador</Label>
            <Select value={reviewerId} onValueChange={setReviewerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un coordinador…" />
              </SelectTrigger>
              <SelectContent>
                {reviewers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.full_name ?? r.email}
                  </SelectItem>
                ))}
                {reviewers.length === 0 && (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    No hay coordinadores registrados.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!reviewerId || transition.isPending}
              onClick={async () => {
                await run('pendiente_revision', { reviewerId })
                setReviewDialog(false)
              }}
            >
              <Icon name="Send" className="h-4 w-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: devolver con observaciones */}
      <Dialog open={observationDialog} onOpenChange={setObservationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver con observaciones</DialogTitle>
            <DialogDescription>
              Resume el motivo. Podrás detallar cada observación en el panel de
              revisión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nota general</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Ajustar terminología y añadir referencias."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setObservationDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={transition.isPending}
              onClick={async () => {
                await run('con_observaciones', { note: note.trim() || undefined })
                setNote('')
                setObservationDialog(false)
              }}
            >
              Solicitar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: rechazar con justificación */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar material</DialogTitle>
            <DialogDescription>
              El rechazo archiva el material y notifica a su responsable. La
              justificación es obligatoria y queda en el historial de revisión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Justificación *</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Motivo del rechazo…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={transition.isPending || !note.trim()}
              onClick={async () => {
                await run('archivado', { note: note.trim() })
                setNote('')
                setRejectDialog(false)
              }}
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
