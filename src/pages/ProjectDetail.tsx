import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { StateBadge } from '@/components/common/StateBadge'
import { Icon } from '@/components/common/Icon'
import { WorkflowBar } from '@/components/projects/WorkflowBar'
import { ObservationsPanel } from '@/components/projects/ObservationsPanel'
import { ProjectActionsMenu } from '@/components/projects/ProjectActionsMenu'
import { ShareDialog } from '@/components/projects/ShareDialog'
import { ClosureCardView } from '@/components/projects/ClosureCardView'
import { ClosureCardDialog } from '@/components/projects/ClosureCardDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { loadClosure } from '@/lib/closure'
import type { ProjectWithRelations } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useDeleteProject,
  useProject,
  useUpdateProject,
} from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '@/contexts/AuthContext'
import {
  FORMAT_DEFS,
  FORMAT_LABELS,
  PERMISSIONS,
} from '@/lib/domain'
import { relativeDate, shortDate } from '@/lib/format'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const role = useRole()
  const { toast } = useToast()
  const { data: project, isLoading } = useProject(id)
  const update = useUpdateProject()
  const del = useDeleteProject()

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [tags, setTags] = React.useState('')
  const [expiresAt, setExpiresAt] = React.useState('')
  const [dirty, setDirty] = React.useState(false)
  const [shareOpen, setShareOpen] = React.useState(false)

  React.useEffect(() => {
    if (project) {
      setTitle(project.title)
      setDescription(project.description ?? '')
      setTags(project.tags.join(', '))
      setExpiresAt(project.expires_at ? project.expires_at.slice(0, 10) : '')
      setDirty(false)
    }
  }, [project])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon name="FileX" className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No se encontró el material.
        </p>
        <Button className="mt-4" onClick={() => navigate('/proyectos')}>
          Volver a proyectos
        </Button>
      </div>
    )
  }

  const canEdit =
    PERMISSIONS.canCreateMaterial(role) &&
    !['publicado', 'archivado'].includes(project.status)

  const formatDef = FORMAT_DEFS.find((f) => f.id === project.format)

  const save = async () => {
    try {
      await update.mutateAsync({
        id: project.id,
        patch: {
          title: title.trim(),
          description: description.trim() || null,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          status: project.status === 'borrador' ? 'en_edicion' : project.status,
        },
      })
      toast({ variant: 'success', title: 'Cambios guardados' })
      setDirty(false)
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar',
        description: e instanceof Error ? e.message : 'Error desconocido',
      })
    }
  }

  return (
    <>
      <ShareDialog project={project} open={shareOpen} onOpenChange={setShareOpen} />
      <PageHeader
        title={project.title}
        description={`${project.code ? project.code + ' · ' : ''}${FORMAT_LABELS[project.format]} · Actualizado ${relativeDate(project.updated_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <StateBadge status={project.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
            >
              <Icon name="Share2" className="h-4 w-4" />
              Compartir
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/proyectos/${project.id}/editor`)}
            >
              <Icon name="PenTool" className="h-4 w-4" />
              {canEdit ? 'Abrir editor' : 'Ver en editor'}
            </Button>
            <ProjectActionsMenu project={project} />
          </div>
        }
      />

      <Button variant="ghost" size="sm" onClick={() => navigate('/proyectos')}>
        <Icon name="ChevronLeft" className="h-4 w-4" />
        Proyectos
      </Button>

      {/* Barra de flujo */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="GitBranch" className="h-4 w-4" />
            Flujo editorial
          </div>
          <WorkflowBar project={project} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="editor">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Vista previa</TabsTrigger>
              <TabsTrigger value="review">
                Revisión
              </TabsTrigger>
              <TabsTrigger value="closure">Ficha de cierre</TabsTrigger>
            </TabsList>

            {/* Editor ligero (metadatos). El editor visual llega en la
                siguiente fase; aquí se gestiona el flujo y los datos. */}
            <TabsContent value="editor" className="space-y-4">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="t">Título</Label>
                    <Input
                      id="t"
                      value={title}
                      disabled={!canEdit}
                      onChange={(e) => {
                        setTitle(e.target.value)
                        setDirty(true)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="d">Descripción</Label>
                    <Textarea
                      id="d"
                      value={description}
                      disabled={!canEdit}
                      onChange={(e) => {
                        setDescription(e.target.value)
                        setDirty(true)
                      }}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
                      <Input
                        id="tags"
                        value={tags}
                        disabled={!canEdit}
                        onChange={(e) => {
                          setTags(e.target.value)
                          setDirty(true)
                        }}
                        placeholder="higiene, protocolo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exp">Vigencia hasta</Label>
                      <Input
                        id="exp"
                        type="date"
                        value={expiresAt}
                        disabled={!canEdit}
                        onChange={(e) => {
                          setExpiresAt(e.target.value)
                          setDirty(true)
                        }}
                      />
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex justify-end">
                      <Button onClick={save} disabled={!dirty || update.isPending}>
                        <Icon name="Save" className="h-4 w-4" />
                        {update.isPending ? 'Guardando…' : 'Guardar'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lienzo del editor visual */}
              <Card>
                <CardContent className="p-6">
                  <div
                    className="mx-auto flex max-w-md items-center justify-center rounded-lg border-2 border-dashed bg-muted/40 text-center"
                    style={{ aspectRatio: formatDef?.ratio ?? '1 / 1.414' }}
                  >
                    <div className="space-y-3 p-6">
                      <Icon
                        name={formatDef?.icon ?? 'FileText'}
                        className="mx-auto h-8 w-8 text-primary"
                      />
                      <p className="text-sm font-medium">
                        Editor visual de {FORMAT_LABELS[project.format]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Diseña con lienzo, capas, herramientas y exportación
                        propias de este formato.
                      </p>
                      <Button onClick={() => navigate(`/proyectos/${project.id}/editor`)}>
                        <Icon name="PenTool" className="h-4 w-4" />
                        Abrir editor
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <h2 className="text-xl font-semibold">{project.title}</h2>
                  {project.description && (
                    <p className="text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  <div
                    className="mx-auto flex max-w-md items-center justify-center rounded-lg border bg-gradient-to-br from-primary/5 to-accent"
                    style={{ aspectRatio: formatDef?.ratio ?? '1 / 1.414' }}
                  >
                    <Icon
                      name={formatDef?.icon ?? 'FileText'}
                      className="h-12 w-12 text-primary/50"
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Vista previa del material antes de enviarlo a revisión o
                    publicarlo.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review">
              <Card>
                <CardContent className="p-6">
                  <ObservationsPanel projectId={project.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="closure">
              <ClosureTab project={project} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Metadatos laterales */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Código</span>
                <span className="font-mono text-xs font-medium">
                  {project.code ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                <StateBadge status={project.status} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Formato</span>
                <span className="font-medium">
                  {FORMAT_LABELS[project.format]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Responsable</span>
                <span className="font-medium">
                  {project.owner?.full_name ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Revisor</span>
                <span className="font-medium">
                  {project.reviewer?.full_name ?? 'Sin asignar'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>{shortDate(project.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vigencia</span>
                <span>{shortDate(project.expires_at)}</span>
              </div>
              {project.published_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Publicado</span>
                  <span>{shortDate(project.published_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {PERMISSIONS.canCreateMaterial(role) && (
            <Card>
              <CardContent className="p-5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={async () => {
                    if (!confirm('¿Eliminar este material de forma permanente?'))
                      return
                    await del.mutateAsync(project.id)
                    toast({ title: 'Material eliminado' })
                    navigate('/proyectos')
                  }}
                >
                  <Icon name="Trash2" className="h-4 w-4" />
                  Eliminar material
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

/** Pestaña de la Ficha de cierre del producto. */
function ClosureTab({ project }: { project: ProjectWithRelations }) {
  const role = useRole()
  const [open, setOpen] = React.useState(false)
  const [refresh, setRefresh] = React.useState(0)
  const closure = React.useMemo(
    () => loadClosure(project),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project, refresh],
  )
  const canManage = PERMISSIONS.canCreateMaterial(role)
  const sent = Boolean(closure?.sent_at)

  return (
    <div className="space-y-4">
      {closure ? (
        <>
          <ClosureCardView card={closure} />
          {canManage && !sent && (
            <div className="flex justify-end">
              <Button onClick={() => setOpen(true)}>
                <Icon name="PenLine" className="h-4 w-4" />
                Continuar ficha
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="FileCheck2"
          title="Ficha de cierre del producto"
          description="Al terminar el material, genera la tarjeta resumen para enviarla al Coordinador: impacto, temas, firma electrónica y envío."
          action={
            canManage && (
              <Button onClick={() => setOpen(true)}>
                <Icon name="FilePlus2" className="h-4 w-4" />
                Generar ficha de cierre
              </Button>
            )
          }
        />
      )}

      <ClosureCardDialog
        project={project}
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setRefresh((r) => r + 1)
        }}
      />
    </div>
  )
}
