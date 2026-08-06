import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleHero } from '@/components/common/ModuleHero'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { StateBadge } from '@/components/common/StateBadge'
import { WorkflowBar } from '@/components/projects/WorkflowBar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAddObservation,
  useObservations,
  useProfiles,
  useProjects,
} from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { MODULES } from '@/lib/modules'
import { cn, initials } from '@/lib/utils'
import { relativeDate } from '@/lib/format'
import {
  FORMAT_DEFS,
  FORMAT_LABELS,
  type MaterialFormat,
  type ProjectState,
} from '@/lib/domain'
import { pageToSvg } from '@/editor/export/exportSvg'
import type { EditorDocument } from '@/editor/model'
import type { ProjectWithRelations } from '@/types/database'

const REVIEW_STATES: ProjectState[] = ['pendiente_revision', 'con_observaciones']

export function ReviewPage() {
  const [statusFilter, setStatusFilter] = React.useState<ProjectState | 'all'>('all')
  const [formatFilter, setFormatFilter] = React.useState<MaterialFormat | 'all'>('all')
  const [authorFilter, setAuthorFilter] = React.useState<string>('all')
  const [order, setOrder] = React.useState<'recientes' | 'antiguos'>('recientes')
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const { data: all, isLoading } = useProjects({})
  const { data: profiles } = useProfiles()

  const queue = React.useMemo(() => {
    let list = (all ?? []).filter((p) => REVIEW_STATES.includes(p.status))
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)
    if (formatFilter !== 'all') list = list.filter((p) => p.format === formatFilter)
    if (authorFilter !== 'all') list = list.filter((p) => p.owner_id === authorFilter)
    list = [...list].sort((a, b) => {
      const d = +new Date(a.updated_at) - +new Date(b.updated_at)
      return order === 'recientes' ? -d : d
    })
    return list
  }, [all, statusFilter, formatFilter, authorFilter, order])

  const selected =
    queue.find((p) => p.id === selectedId) ?? queue[0] ?? null

  const authors = React.useMemo(() => {
    const ids = new Set((all ?? []).filter((p) => REVIEW_STATES.includes(p.status)).map((p) => p.owner_id))
    return (profiles ?? []).filter((p) => ids.has(p.id))
  }, [all, profiles])

  return (
    <>
      <ModuleHero
        module={MODULES.revision}
        eyebrow="Control de calidad editorial"
        title="Revisión"
        subtitle="Cola de materiales por revisar, con comentarios generales y por página, y decisiones justificadas."
        compact
      />
      <ConfigNotice />

      {/* Filtros */}
      <div className="rounded-2xl border bg-card p-3 surface">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as ProjectState | 'all')}
            width="w-[200px]"
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'pendiente_revision', label: 'Pendiente de revisión' },
              { value: 'con_observaciones', label: 'Con observaciones' },
            ]}
          />
          <FilterSelect
            value={formatFilter}
            onChange={(v) => setFormatFilter(v as MaterialFormat | 'all')}
            width="w-[170px]"
            options={[
              { value: 'all', label: 'Todos los formatos' },
              ...FORMAT_DEFS.map((f) => ({ value: f.id, label: f.label })),
            ]}
          />
          <FilterSelect
            value={authorFilter}
            onChange={setAuthorFilter}
            width="w-[180px]"
            options={[
              { value: 'all', label: 'Todos los autores' },
              ...authors.map((a) => ({ value: a.id, label: a.full_name ?? a.email })),
            ]}
          />
          <FilterSelect
            value={order}
            onChange={(v) => setOrder(v as 'recientes' | 'antiguos')}
            width="w-[160px]"
            options={[
              { value: 'recientes', label: 'Más recientes' },
              { value: 'antiguos', label: 'Más antiguos' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : queue.length === 0 ? (
        <EmptyState
          icon="ClipboardCheck"
          title="Sin materiales por revisar"
          description="La cola de revisión está vacía. Todo al día."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Cola */}
          <div className="space-y-2">
            <p className="px-1 text-sm font-semibold text-muted-foreground">
              Cola · {queue.length}
            </p>
            {queue.map((p) => (
              <QueueItem
                key={p.id}
                project={p}
                active={p.id === selected?.id}
                onClick={() => setSelectedId(p.id)}
              />
            ))}
          </div>

          {/* Workspace */}
          {selected && <ReviewWorkspace key={selected.id} project={selected} />}
        </div>
      )}
    </>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
  width,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  width: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn(width, 'border-0 bg-muted/60')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function QueueItem({
  project,
  active,
  onClick,
}: {
  project: ProjectWithRelations
  active: boolean
  onClick: () => void
}) {
  const def = FORMAT_DEFS.find((f) => f.id === project.format)
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition-all surface',
        active ? 'ring-2 ring-offset-1' : 'hover:-translate-y-0.5',
      )}
      style={active ? { boxShadow: `0 0 0 2px ${MODULES.revision.color}` } : undefined}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${MODULES.revision.color}1f`, color: MODULES.revision.color }}
      >
        <Icon name={def?.icon ?? 'FileText'} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{project.title}</span>
        <span className="mt-1 flex items-center gap-2">
          <StateBadge status={project.status} />
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {project.owner?.full_name ?? '—'} · {relativeDate(project.updated_at)}
        </span>
      </span>
    </button>
  )
}

function ReviewWorkspace({ project }: { project: ProjectWithRelations }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: observations } = useObservations(project.id)
  const add = useAddObservation(project.id)
  const [target, setTarget] = React.useState('General')
  const [body, setBody] = React.useState('')

  const doc = (project.content as unknown as EditorDocument)
  const pages = doc && Array.isArray(doc.pages) ? doc.pages : []
  const preview =
    pages.length > 0
      ? `data:image/svg+xml;utf8,${encodeURIComponent(pageToSvg(doc, pages[0]))}`
      : null

  const targets = ['General', ...pages.map((_, i) => `Página ${i + 1}`), 'Elemento seleccionado']

  const submit = async () => {
    if (!body.trim()) return
    const prefixed = target === 'General' ? body.trim() : `[${target}] ${body.trim()}`
    try {
      await add.mutateAsync(prefixed)
      setBody('')
      toast({ variant: 'success', title: 'Comentario añadido' })
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'No se pudo comentar',
        description: e instanceof Error ? e.message : 'Conecta Supabase para guardar.',
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabecera del material */}
      <div className="rounded-2xl border bg-card p-5 surface">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StateBadge status={project.status} />
              {project.code && (
                <span className="font-mono text-xs text-muted-foreground">{project.code}</span>
              )}
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">{project.title}</h2>
            <p className="text-sm text-muted-foreground">
              {FORMAT_LABELS[project.format]} · {project.owner?.full_name ?? '—'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/proyectos/${project.id}/editor`)}>
            <Icon name="PenTool" className="h-4 w-4" />
            Abrir en editor
          </Button>
        </div>

        {/* Decisiones agrupadas */}
        <div className="mt-4 rounded-xl bg-muted/50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Decisión de revisión
          </p>
          <WorkflowBar project={project} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Vista del material */}
        <div className="rounded-2xl border bg-card p-4 surface">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Vista del material</p>
          {preview ? (
            <img
              src={preview}
              alt="Vista del material"
              className="mx-auto max-h-[420px] w-full rounded-lg border object-contain"
            />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <Icon
                name={FORMAT_DEFS.find((f) => f.id === project.format)?.icon ?? 'FileText'}
                className="mb-2 h-8 w-8 text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">
                Vista previa disponible al abrir en el editor.
              </p>
            </div>
          )}
        </div>

        {/* Comentarios e historial */}
        <div className="rounded-2xl border bg-card p-4 surface">
          <Tabs defaultValue="comentarios">
            <TabsList>
              <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="comentarios" className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {targets.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTarget(t)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                      target === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-accent',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Comentario (${target})…`}
                rows={3}
              />
              <div className="flex justify-end">
                <Button size="sm" disabled={!body.trim() || add.isPending} onClick={submit}>
                  <Icon name="MessageSquarePlus" className="h-4 w-4" />
                  Añadir comentario
                </Button>
              </div>
              <CommentList observations={observations} />
            </TabsContent>

            <TabsContent value="historial">
              <CommentList observations={observations} history />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function CommentList({
  observations,
  history = false,
}: {
  observations?: ReturnType<typeof useObservations>['data']
  history?: boolean
}) {
  if (!observations || observations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        {history ? 'Sin historial todavía.' : 'Sin comentarios todavía.'}
      </p>
    )
  }
  return (
    <ul className="space-y-3">
      {observations.map((o) => {
        const isDecision = o.body.startsWith('Rechazado:')
        return (
          <li key={o.id} className="flex gap-3 rounded-lg border bg-card p-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={o.author?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {initials(o.author?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{o.author?.full_name ?? 'Revisor'}</span>
                <span className="text-xs text-muted-foreground">{relativeDate(o.created_at)}</span>
              </div>
              <p className={cn('text-sm', isDecision && 'font-medium text-destructive')}>
                {o.body}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
