import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
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

  return (
    <>
      <PageHeader
        title="Mis proyectos"
        description="Todos tus materiales y su estado en el flujo editorial."
        actions={
          PERMISSIONS.canCreateMaterial(role) && (
            <Button onClick={() => navigate('/crear')}>
              <Icon name="Plus" className="h-4 w-4" />
              Crear material
            </Button>
          )
        }
      />

      <ConfigNotice />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="Search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título…"
            className="pl-9"
          />
        </div>

        <Select value={scope} onValueChange={(v) => setScope(v as 'mine' | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mine">Mis materiales</SelectItem>
            <SelectItem value="all">Toda la unidad</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(v) => setStatus(v as ProjectState | 'all')}
        >
          <SelectTrigger className="w-[190px]">
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
          <SelectTrigger className="w-[170px]">
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
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            showArchived ? 'border-primary bg-accent text-primary' : 'hover:bg-accent'
          }`}
        >
          <Icon name="Archive" className="h-4 w-4" />
          Archivados
        </button>
      </div>

      {/* Resultados */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
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
            PERMISSIONS.canCreateMaterial(role) && (
              <Button onClick={() => navigate('/crear')}>
                <Icon name="Plus" className="h-4 w-4" />
                Crear el primero
              </Button>
            )
          }
        />
      )}
    </>
  )
}
