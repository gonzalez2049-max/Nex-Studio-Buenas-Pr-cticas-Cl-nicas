import * as React from 'react'
import { ModuleHero } from '@/components/common/ModuleHero'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useResources } from '@/hooks/queries'
import { MODULES } from '@/lib/modules'
import { cn } from '@/lib/utils'
import type { Resource } from '@/types/database'

const KIND_ICON: Record<string, string> = {
  guia: 'BookOpen',
  norma: 'Scale',
  video: 'PlayCircle',
  enlace: 'Link',
  plantilla: 'LayoutTemplate',
  documento: 'FileText',
}

/** Líneas de cuidado del Kit Champion. */
const CHAMPION_CATEGORIES = [
  'all',
  'LPP',
  'Accesos vasculares',
  'Dolor',
  'Caídas',
] as const

export function ResourcesPage({
  championKit = false,
}: {
  championKit?: boolean
}) {
  const [category, setCategory] = React.useState<string>('all')
  const { data, isLoading } = useResources(
    championKit,
    championKit ? category : undefined,
  )

  const title = championKit ? 'Kit Champion' : 'Recursos'
  const description = championKit
    ? 'Materiales, guías y activos para impulsar la adopción de buenas prácticas, por línea de cuidado.'
    : 'Biblioteca institucional de guías, normativas y activos de referencia para la producción.'

  return (
    <>
      <ModuleHero
        module={championKit ? MODULES.kit : MODULES.recursos}
        eyebrow={championKit ? 'Adopción' : 'Biblioteca institucional'}
        title={title}
        subtitle={description}
        compact
      />
      <ConfigNotice />

      {championKit && (
        <div className="flex flex-wrap gap-2">
          {CHAMPION_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-accent',
              )}
            >
              {c === 'all' ? 'Todas' : c}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={championKit ? 'Sparkles' : 'BookOpen'}
          title={championKit ? 'Kit Champion vacío' : 'Sin recursos'}
          description="Aún no se han publicado recursos en esta sección."
        />
      )}
    </>
  )
}

function ResourceCard({ resource }: { resource: Resource }) {
  const body = (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon name={KIND_ICON[resource.kind] ?? 'File'} className="h-4 w-4" />
          </div>
          {resource.category && (
            <Badge variant="secondary" className="font-normal">
              {resource.category}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm font-medium">{resource.title}</p>
        {resource.description && (
          <p className="line-clamp-3 text-xs text-muted-foreground">
            {resource.description}
          </p>
        )}
        {resource.url && (
          <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-primary">
            Abrir recurso
            <Icon name="ExternalLink" className="h-3 w-3" />
          </span>
        )}
      </CardContent>
    </Card>
  )

  if (resource.url) {
    return (
      <a href={resource.url} target="_blank" rel="noreferrer" className="block">
        {body}
      </a>
    )
  }
  return body
}
