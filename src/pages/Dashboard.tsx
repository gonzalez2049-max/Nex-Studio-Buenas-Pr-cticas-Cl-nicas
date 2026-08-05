import { Link, useNavigate } from 'react-router-dom'
import {
  useActivity,
  useDashboardMetrics,
  useProjects,
} from '@/hooks/queries'
import { useAuth, useRole } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { StateBadge } from '@/components/common/StateBadge'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { PERMISSIONS, STATE_LABELS } from '@/lib/domain'
import { relativeDate } from '@/lib/format'
import { initials } from '@/lib/utils'

const QUICK_ACTIONS = [
  { to: '/crear', icon: 'Plus', label: 'Crear material', perm: PERMISSIONS.canCreateMaterial },
  { to: '/plantillas', icon: 'LayoutTemplate', label: 'Explorar plantillas' },
  { to: '/proyectos', icon: 'FolderKanban', label: 'Mis proyectos' },
  { to: '/transferencia', icon: 'Share2', label: 'Registrar transferencia' },
]

function MetricCard({
  label,
  value,
  icon,
  tone,
  loading,
}: {
  label: string
  value: number | string
  icon: string
  tone: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { profile } = useAuth()
  const role = useRole()
  const navigate = useNavigate()
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: recent, isLoading: recentLoading } = useProjects({})
  const { data: pending } = useProjects({ status: 'pendiente_revision' })
  const { data: activity } = useActivity(8)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'a NEX Studio'

  return (
    <>
      <PageHeader
        title={`Hola, ${firstName}`}
        description="Panel institucional de transferencia del conocimiento en Buenas Prácticas Clínicas."
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

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Materiales totales"
          value={metrics?.total ?? 0}
          icon="Files"
          tone="bg-primary/10 text-primary"
          loading={metricsLoading}
        />
        <MetricCard
          label="Pendientes de revisión"
          value={metrics?.pendingReview ?? 0}
          icon="ClipboardCheck"
          tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          loading={metricsLoading}
        />
        <MetricCard
          label="Publicados"
          value={metrics?.published ?? 0}
          icon="Globe"
          tone="bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
          loading={metricsLoading}
        />
        <MetricCard
          label="Por vencer (30 d)"
          value={metrics?.expiringSoon ?? 0}
          icon="Clock"
          tone="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
          loading={metricsLoading}
        />
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Accesos rápidos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.filter((a) => !a.perm || a.perm(role)).map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
            >
              <Icon name={a.icon} className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Proyectos recientes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Proyectos recientes
            </h2>
            <Link to="/proyectos" className="text-xs font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {recentLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-lg" />
              ))}
            </div>
          ) : recent && recent.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recent.slice(0, 6).map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="FolderPlus"
              title="Aún no hay materiales"
              description="Crea tu primer material de transferencia para empezar."
              action={
                PERMISSIONS.canCreateMaterial(role) && (
                  <Button onClick={() => navigate('/crear')}>
                    <Icon name="Plus" className="h-4 w-4" />
                    Crear material
                  </Button>
                )
              }
            />
          )}
        </div>

        {/* Pendientes + actividad */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Pendientes
            </h2>
            <Card>
              <CardContent className="p-3">
                {pending && pending.length > 0 ? (
                  <ul className="divide-y">
                    {pending.slice(0, 5).map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/proyectos/${p.id}`}
                          className="flex items-center justify-between gap-2 py-2.5 hover:text-primary"
                        >
                          <span className="line-clamp-1 text-sm">
                            {p.title}
                          </span>
                          <StateBadge status={p.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nada pendiente. Todo al día.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Actividad reciente
            </h2>
            <Card>
              <CardContent className="p-3">
                {activity && activity.length > 0 ? (
                  <ul className="space-y-3">
                    {activity.map((a) => (
                      <li key={a.id} className="flex items-start gap-2.5">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={a.actor?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {initials(a.actor?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-xs">
                          <span className="font-medium">
                            {a.actor?.full_name ?? 'Alguien'}
                          </span>{' '}
                          <span className="text-muted-foreground">
                            {a.to_status
                              ? `→ ${STATE_LABELS[a.to_status]}`
                              : a.action}
                          </span>
                          <p className="text-muted-foreground/70">
                            {relativeDate(a.created_at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sin actividad todavía.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
