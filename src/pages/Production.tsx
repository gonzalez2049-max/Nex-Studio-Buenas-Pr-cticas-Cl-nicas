import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { Icon } from '@/components/common/Icon'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardMetrics, useProjects } from '@/hooks/queries'
import {
  FORMAT_LABELS,
  PROJECT_STATES,
  STATE_BADGE,
  STATE_LABELS,
  type ProjectState,
} from '@/lib/domain'
import { relativeDate } from '@/lib/format'

/** Columnas del tablero de producción (flujo editorial). */
const PIPELINE: ProjectState[] = [
  'borrador',
  'en_edicion',
  'pendiente_revision',
  'con_observaciones',
  'aprobado',
  'publicado',
]

export function ProductionPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: projects, isLoading } = useProjects({})

  const byStatus = (status: ProjectState) =>
    (projects ?? []).filter((p) => p.status === status)

  return (
    <>
      <PageHeader
        title="Producción UBPC"
        description="Visión global de la línea de producción editorial de la unidad."
      />
      <ConfigNotice />

      {/* Resumen por estado */}
      <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {PROJECT_STATES.map((s) => (
          <Card key={s}>
            <CardContent className="p-4">
              {metricsLoading ? (
                <Skeleton className="h-7 w-8" />
              ) : (
                <p className="text-xl font-semibold tabular-nums">
                  {metrics?.byStatus[s] ?? 0}
                </p>
              )}
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                {STATE_LABELS[s]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tablero */}
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : (
        <div className="grid gap-4 overflow-x-auto md:grid-cols-2 xl:grid-cols-3">
          {PIPELINE.map((status) => {
            const items = byStatus(status)
            return (
              <div
                key={status}
                className="flex flex-col rounded-lg border bg-muted/30"
              >
                <div className="flex items-center justify-between border-b px-3 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_BADGE[status]}`}
                  >
                    {STATE_LABELS[status]}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {items.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      Sin materiales
                    </p>
                  ) : (
                    items.map((p) => (
                      <Link
                        key={p.id}
                        to={`/proyectos/${p.id}`}
                        className="block rounded-md border bg-card p-3 transition-shadow hover:shadow-sm"
                      >
                        <p className="line-clamp-2 text-sm font-medium">
                          {p.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Icon name="FileText" className="h-3 w-3" />
                          {FORMAT_LABELS[p.format]}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{p.owner?.full_name ?? '—'}</span>
                          <span>{relativeDate(p.updated_at)}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
