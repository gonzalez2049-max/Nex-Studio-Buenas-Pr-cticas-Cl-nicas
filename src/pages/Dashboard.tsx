import { Link, useNavigate } from 'react-router-dom'
import {
  useActivity,
  useDashboardMetrics,
  useProjects,
} from '@/hooks/queries'
import { useAuth, useRole } from '@/contexts/AuthContext'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { StateBadge } from '@/components/common/StateBadge'
import { ModuleHero } from '@/components/common/ModuleHero'
import { ClinicalBackdrop } from '@/components/common/ClinicalBackdrop'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  FORMAT_DEFS,
  FORMAT_LABELS,
  PERMISSIONS,
  STATE_LABELS,
  type ProjectState,
} from '@/lib/domain'
import { MODULES, moduleGradient } from '@/lib/modules'
import { relativeDate } from '@/lib/format'
import { initials } from '@/lib/utils'
import type { ProjectWithRelations } from '@/types/database'

const IN_PROGRESS: ProjectState[] = [
  'con_observaciones',
  'en_edicion',
  'borrador',
  'pendiente_revision',
]

/** Estados que se muestran en el termómetro de producción. */
const PIPELINE: ProjectState[] = [
  'borrador',
  'en_edicion',
  'pendiente_revision',
  'con_observaciones',
  'aprobado',
  'publicado',
]

const STATE_HEX: Record<ProjectState, string> = {
  borrador: '#94a3b8',
  en_edicion: '#3b82f6',
  pendiente_revision: '#f59e0b',
  con_observaciones: '#f97316',
  aprobado: '#10b981',
  publicado: '#14b8a6',
  archivado: '#a1a1aa',
  vencido: '#ef4444',
}

export function DashboardPage() {
  const { profile } = useAuth()
  const role = useRole()
  const navigate = useNavigate()
  const { data: metrics } = useDashboardMetrics()
  const { data: recent, isLoading: recentLoading } = useProjects({})
  const { data: pending } = useProjects({ status: 'pendiente_revision' })
  const { data: activity } = useActivity(6)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'de nuevo'
  const canCreate = PERMISSIONS.canCreateMaterial(role)

  // Proyecto activo destacado: el más reciente en curso (propio si es posible).
  const mine = (recent ?? []).filter((p) => p.owner?.id === profile?.id)
  const pool = mine.length ? mine : recent ?? []
  const featured =
    pool.find((p) => IN_PROGRESS.includes(p.status)) ?? pool[0] ?? null

  return (
    <>
      <ModuleHero
        module={MODULES.inicio}
        eyebrow="Estudio editorial · Buenas Prácticas Clínicas"
        title={`Hola, ${firstName}`}
        subtitle="Tu estación de trabajo para crear, revisar y publicar materiales de transferencia del conocimiento."
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

      <div className="grid gap-7 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-7 lg:col-span-2">
          {/* Proyecto activo destacado */}
          <div>
            <SectionLabel icon="Radio" color={MODULES.proyectos.color}>
              Proyecto activo
            </SectionLabel>
            {recentLoading ? (
              <Skeleton className="h-52 rounded-3xl" />
            ) : featured ? (
              <FeaturedProject project={featured} />
            ) : (
              <EmptyState
                icon="FolderPlus"
                title="Aún no hay materiales"
                description="Crea tu primer material para verlo destacado aquí."
                action={
                  canCreate && (
                    <Button onClick={() => navigate('/crear')}>
                      <Icon name="Sparkle" className="h-4 w-4" />
                      Crear nuevo material
                    </Button>
                  )
                }
              />
            )}
          </div>

          {/* Proyectos recientes */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel icon="Clock" color={MODULES.proyectos.color} inline>
                Recientes
              </SectionLabel>
              <Link to="/proyectos" className="text-sm font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            {recentLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl" />
                ))}
              </div>
            ) : recent && recent.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recent
                  .filter((p) => p.id !== featured?.id)
                  .slice(0, 6)
                  .map((p) => (
                    <ProjectCard key={p.id} project={p} showActions />
                  ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-7">
          <ProductionStatus metrics={metrics} />
          <PendingReview pending={pending} />
          <RecentActivity activity={activity} />
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------- subcomponentes --- */

function SectionLabel({
  icon,
  color,
  children,
  inline = false,
}: {
  icon: string
  color: string
  children: React.ReactNode
  inline?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 ${inline ? '' : 'mb-3'}`}>
      <span
        className="flex h-6 w-6 items-center justify-center rounded-lg"
        style={{ background: `${color}1f`, color }}
      >
        <Icon name={icon} className="h-3.5 w-3.5" />
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {children}
      </h2>
    </div>
  )
}

function FeaturedProject({ project }: { project: ProjectWithRelations }) {
  const navigate = useNavigate()
  const def = FORMAT_DEFS.find((f) => f.id === project.format)
  const g = moduleGradient(MODULES.proyectos, 120)

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card surface">
      <div className="grid sm:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <StateBadge status={project.status} />
            {project.code && (
              <span className="font-mono text-xs text-muted-foreground">
                {project.code}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {FORMAT_LABELS[project.format]}
            </p>
            <h3 className="mt-1 text-2xl font-semibold leading-tight tracking-tight">
              {project.title}
            </h3>
          </div>
          {project.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button onClick={() => navigate(`/proyectos/${project.id}/editor`)}>
              <Icon name="PenTool" className="h-4 w-4" />
              Continuar en el editor
            </Button>
            <Button variant="outline" onClick={() => navigate(`/proyectos/${project.id}`)}>
              Ver detalle
            </Button>
            <span className="text-xs text-muted-foreground">
              Actualizado {relativeDate(project.updated_at)}
            </span>
          </div>
        </div>

        {/* Panel visual */}
        <div className="relative hidden items-center justify-center sm:flex" style={{ background: g }}>
          <ClinicalBackdrop className="absolute inset-0 h-full w-full" tone="#ffffff" opacity={0.9} />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Icon name={def?.icon ?? 'FileText'} className="h-9 w-9 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductionStatus({
  metrics,
}: {
  metrics: ReturnType<typeof useDashboardMetrics>['data']
}) {
  const total = metrics?.total ?? 0
  const max = Math.max(1, ...PIPELINE.map((s) => metrics?.byStatus[s] ?? 0))
  return (
    <div className="rounded-2xl border bg-card p-5 surface">
      <SectionLabel icon="Activity" color={MODULES.transferencia.color}>
        Estado de producción
      </SectionLabel>
      <p className="mb-4 text-3xl font-semibold tabular-nums">
        {total}
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          materiales
        </span>
      </p>
      <div className="space-y-2.5">
        {PIPELINE.map((s) => {
          const n = metrics?.byStatus[s] ?? 0
          return (
            <div key={s} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-muted-foreground">
                {STATE_LABELS[s]}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(n / max) * 100}%`,
                    minWidth: n ? 6 : 0,
                    background: STATE_HEX[s],
                  }}
                />
              </div>
              <span className="w-6 text-right text-xs font-medium tabular-nums">
                {n}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PendingReview({ pending }: { pending?: ProjectWithRelations[] }) {
  return (
    <div className="rounded-2xl border bg-card p-5 surface">
      <SectionLabel icon="ClipboardCheck" color={MODULES.revision.color}>
        Pendientes de revisión
      </SectionLabel>
      {pending && pending.length > 0 ? (
        <ul className="space-y-1">
          {pending.slice(0, 5).map((p) => (
            <li key={p.id}>
              <Link
                to={`/proyectos/${p.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${MODULES.revision.color}1f`, color: MODULES.revision.color }}
                >
                  <Icon name={FORMAT_DEFS.find((f) => f.id === p.format)?.icon ?? 'FileText'} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {p.owner?.full_name ?? '—'}
                  </span>
                </span>
                <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nada pendiente. Todo al día.
        </p>
      )}
    </div>
  )
}

function RecentActivity({
  activity,
}: {
  activity?: ReturnType<typeof useActivity>['data']
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 surface">
      <SectionLabel icon="History" color={MODULES.administracion.color}>
        Actividad reciente
      </SectionLabel>
      {activity && activity.length > 0 ? (
        <ul className="space-y-3.5">
          {activity.map((a) => (
            <li key={a.id} className="flex items-start gap-2.5">
              <Avatar className="h-7 w-7">
                <AvatarImage src={a.actor?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {initials(a.actor?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs leading-relaxed">
                <span className="font-medium">{a.actor?.full_name ?? 'Alguien'}</span>{' '}
                <span className="text-muted-foreground">
                  {a.to_status ? `movió a ${STATE_LABELS[a.to_status]}` : a.action}
                </span>
                <p className="text-muted-foreground/70">{relativeDate(a.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Sin actividad todavía.
        </p>
      )}
    </div>
  )
}
