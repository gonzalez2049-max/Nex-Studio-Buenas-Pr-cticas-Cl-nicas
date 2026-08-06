import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleHero } from '@/components/common/ModuleHero'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateProject, useTemplates } from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '@/contexts/AuthContext'
import {
  FORMAT_DEFS,
  FORMAT_LABELS,
  PERMISSIONS,
  type MaterialFormat,
} from '@/lib/domain'
import { MODULES } from '@/lib/modules'
import type { Template } from '@/types/database'

export function TemplatesPage() {
  const navigate = useNavigate()
  const role = useRole()
  const { toast } = useToast()
  const [format, setFormat] = React.useState<MaterialFormat | 'all'>('all')
  const { data, isLoading } = useTemplates(
    format === 'all' ? undefined : format,
  )
  const createProject = useCreateProject()
  const canUse = PERMISSIONS.canCreateMaterial(role)

  const use = async (t: Template) => {
    try {
      const project = await createProject.mutateAsync({
        title: t.name,
        description: t.description ?? undefined,
        format: t.format,
        template_id: t.id,
        content: t.content as Record<string, unknown>,
      })
      toast({ variant: 'success', title: 'Material creado desde plantilla' })
      navigate(`/proyectos/${project.id}`)
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'No se pudo usar la plantilla',
        description: e instanceof Error ? e.message : 'Error desconocido',
      })
    }
  }

  return (
    <>
      <ModuleHero
        module={MODULES.plantillas}
        eyebrow="Biblioteca"
        title="Plantillas"
        subtitle="Modelos institucionales validados para acelerar la producción de materiales."
        compact
      />

      <ConfigNotice />

      <div className="flex items-center justify-end">
        <Select
          value={format}
          onValueChange={(v) => setFormat(v as MaterialFormat | 'all')}
        >
          <SelectTrigger className="w-[190px] border-0 bg-card surface">
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
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((t) => (
            <Card key={t.id} className="flex flex-col overflow-hidden rounded-2xl surface transition-all hover:-translate-y-0.5">
              <div
                className="relative flex h-28 items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${MODULES.plantillas.color}22, ${MODULES.plantillas.to}14)` }}
              >
                <Icon
                  name={FORMAT_DEFS.find((f) => f.id === t.format)?.icon ?? 'FileText'}
                  className="h-9 w-9"
                  style={{ color: MODULES.plantillas.color }}
                />
                {t.is_official && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    <Icon name="BadgeCheck" className="h-3 w-3" /> Oficial
                  </span>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {FORMAT_LABELS[t.format]}
                  {t.category ? ` · ${t.category}` : ''}
                </p>
                {t.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                )}
                {canUse && (
                  <Button
                    size="sm"
                    className="mt-auto"
                    disabled={createProject.isPending}
                    onClick={() => use(t)}
                  >
                    Usar plantilla
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="LayoutTemplate"
          title="Sin plantillas"
          description="Aún no hay plantillas para este formato. Un administrador o coordinador puede publicarlas."
        />
      )}
    </>
  )
}
