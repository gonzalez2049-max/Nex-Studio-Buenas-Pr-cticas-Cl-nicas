import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ShareDialog } from '@/components/projects/ShareDialog'
import { HistoryDialog } from '@/components/projects/HistoryDialog'
import {
  useDeleteProject,
  useDuplicateProject,
  useTransitionProject,
  useUpdateProject,
} from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/lib/domain'
import type { Project } from '@/types/database'

export function ProjectActionsMenu({
  project,
  size = 'icon',
}: {
  project: Project
  size?: 'icon' | 'button'
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const role = useRole()
  const update = useUpdateProject()
  const duplicate = useDuplicateProject()
  const del = useDeleteProject()
  const transition = useTransitionProject()

  const [renameOpen, setRenameOpen] = React.useState(false)
  const [shareOpen, setShareOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [title, setTitle] = React.useState(project.title)

  const canEdit = PERMISSIONS.canCreateMaterial(role)
  const isArchived = project.status === 'archivado'

  const doRename = async () => {
    await update.mutateAsync({ id: project.id, patch: { title: title.trim() } })
    toast({ variant: 'success', title: 'Material renombrado' })
    setRenameOpen(false)
  }

  const archive = async (to: 'archivado' | 'borrador') => {
    await transition.mutateAsync({ project, to })
    toast({
      variant: 'success',
      title: to === 'archivado' ? 'Material archivado' : 'Material restaurado',
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {size === 'icon' ? (
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow-sm hover:text-foreground"
              title="Acciones"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          ) : (
            <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
              Acciones
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => navigate(`/proyectos/${project.id}/editor`)}>
            <Icon name="PenTool" className="h-4 w-4" />
            {canEdit ? 'Editar' : 'Ver en editor'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/proyectos/${project.id}`)}>
            <Icon name="Eye" className="h-4 w-4" />
            Ver detalle
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onClick={() => { setTitle(project.title); setRenameOpen(true) }}>
              <Icon name="TextCursorInput" className="h-4 w-4" />
              Renombrar
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem
              onClick={async () => {
                const p = await duplicate.mutateAsync(project.id)
                toast({ variant: 'success', title: 'Material duplicado' })
                navigate(`/proyectos/${p.id}`)
              }}
            >
              <Icon name="Copy" className="h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShareOpen(true)}>
            <Icon name="Share2" className="h-4 w-4" />
            Compartir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
            <Icon name="History" className="h-4 w-4" />
            Historial de versiones
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              {isArchived ? (
                <DropdownMenuItem onClick={() => archive('borrador')}>
                  <Icon name="ArchiveRestore" className="h-4 w-4" />
                  Restaurar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => archive('archivado')}>
                  <Icon name="Archive" className="h-4 w-4" />
                  Archivar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  if (!confirm('¿Eliminar este material de forma permanente?')) return
                  await del.mutateAsync(project.id)
                  toast({ title: 'Material eliminado' })
                }}
              >
                <Icon name="Trash2" className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Renombrar */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Renombrar material</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rn">Título</Label>
            <Input id="rn" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!title.trim() || update.isPending} onClick={doRename}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareDialog project={project} open={shareOpen} onOpenChange={setShareOpen} />
      <HistoryDialog projectId={project.id} open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  )
}
