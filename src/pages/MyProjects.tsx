import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleHero } from '@/components/common/ModuleHero'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/hooks/queries'
import { useAuth, useRole } from '@/contexts/AuthContext'
import { MODULES } from '@/lib/modules'
import { cn } from '@/lib/utils'
import {
  FORMAT_DEFS,
  PERMISSIONS,
  PROJECT_STATES,
  STATE_LABELS,
  type MaterialFormat,
  type ProjectState,
} from '@/lib/domain'

export function MyProjectsPage() {
  const navigate = useNavigate()
  const role = useRole()
  const { profile } = useAuth()
  const [status, setStatus] = React.useState<ProjectState | 'all'>('all')
  const [format, setFormat] = React.useState<MaterialFormat | 'all'>('all')
  const [scope, setScope] = React.useState<'mine' | 'all'>('mine')
  const [search, setSearch] = React.useState('')
  const [showArchived, setShowArchived] = React.useState(false)

  const { data: raw, isLoading } = useProjects({
    status,
    format,
    ownerId: scope === 'mine' ? profile?.id : undefined,
    search: search.trim() || undefined,
  })

  // Oculta archivados salvo que se pidan explícitamente.
  const data = React.useMemo(
    () =>
      (raw ?? []).filter(
        (p) =>
          showArchived || status === 'archivado' || p.status !== 'archivado',
      ),
    [raw, showArchived, status],
  )

  const canCreate = PERMISSIONS.canCreateMaterial(role)

  return (
    <>
      <ModuleHero
        module={MODULES.proyectos}
        eyebrow="Gestión editorial"
        title="Mis proyectos"
        subtitle="Edita, revisa, comparte y organiza tus materiales de transferencia del conocimiento."
        actions={
          canCreate && (
            <button
              onClick={() => navigate('/crear')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ color: MODULES.crear.color }}
            >
              <Icon name="Sparkle" className="h-4 w-4" />
              Crear nuevo material
            </button>
          )
        }
      />

      <ConfigNotice />

      {/* Barra de filtros en superficie */}
      <div className="rounded-2xl border bg-card p-3 surface">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Icon
              name="Search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título…"
              className="border-0 bg-muted/60 pl-9"
            />
          </div>

          {/* Alcance segmentado */}
          <div className="flex rounded-lg bg-muted p-1">
            {(['mine', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  scope === s
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s === 'mine' ? 'Míos' : 'Unidad'}
              </button>
            ))}
          </div>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ProjectState | 'all')}
          >
            <SelectTrigger className="w-[180px] border-0 bg-muted/60">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {PROJECT_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={format}
            onValueChange={(v) => setFormat(v as MaterialFormat | 'all')}
          >
            <SelectTrigger className="w-[170px] border-0 bg-muted/60">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los formatos</SelectItem>
              {FORMAT_DEFS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => setShowArchived((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              showArchived
                ? 'bg-primary/10 text-primary'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon name="Archive" className="h-4 w-4" />
            Archivados
          </button>
        </div>
      </div>

      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? 'material' : 'materiales'}
        </p>
      )}

      {/* Resultados */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((p) => (
            <ProjectCard key={p.id} project={p} showActions />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="FolderSearch"
          title="Sin materiales"
          description="No hay materiales que coincidan con los filtros seleccionados."
          action={
            canCreate && (
              <Button onClick={() => navigate('/crear')}>
                <Icon name="Sparkle" className="h-4 w-4" />
                Crear el primero
              </Button>
            )
          }
        />
      )}
    </>
  )
}
