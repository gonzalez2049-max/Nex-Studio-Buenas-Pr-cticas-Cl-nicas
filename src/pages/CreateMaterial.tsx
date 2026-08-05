import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateProject, useTemplates } from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { FORMAT_DEFS, type MaterialFormat } from '@/lib/domain'
import { cn } from '@/lib/utils'
import type { Template } from '@/types/database'

type Step = 'format' | 'source' | 'details'

const STEPS: { id: Step; label: string }[] = [
  { id: 'format', label: 'Formato' },
  { id: 'source', label: 'Plantilla o desde cero' },
  { id: 'details', label: 'Detalles' },
]

export function CreateMaterialPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createProject = useCreateProject()

  const [step, setStep] = React.useState<Step>('format')
  const [format, setFormat] = React.useState<MaterialFormat | null>(null)
  const [template, setTemplate] = React.useState<Template | null>(null)
  const [fromScratch, setFromScratch] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')

  const { data: templates, isLoading: templatesLoading } = useTemplates(
    format ?? undefined,
  )

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  const selectFormat = (f: MaterialFormat) => {
    setFormat(f)
    setTemplate(null)
    setFromScratch(false)
    setStep('source')
  }

  const chooseTemplate = (t: Template | null) => {
    setTemplate(t)
    setFromScratch(t === null)
    if (t && !title) setTitle(t.name)
    setStep('details')
  }

  const onCreate = async () => {
    if (!format || !title.trim()) return
    try {
      const project = await createProject.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        format,
        template_id: template?.id ?? null,
        content: (template?.content as Record<string, unknown>) ?? {},
      })
      toast({
        variant: 'success',
        title: 'Material creado',
        description: 'Se guardó como borrador. Continúa en el editor.',
      })
      navigate(`/proyectos/${project.id}`)
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'No se pudo crear el material',
        description: e instanceof Error ? e.message : 'Error desconocido',
      })
    }
  }

  return (
    <>
      <PageHeader
        title="Crear material"
        description="Sigue el flujo institucional: elige un formato, parte de una plantilla o desde cero, y completa los datos."
      />

      {/* Indicador de pasos */}
      <ol className="flex items-center gap-2 text-sm">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <li
              className={cn(
                'flex items-center gap-2',
                i <= stepIndex ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  i < stepIndex && 'bg-primary text-primary-foreground',
                  i === stepIndex && 'bg-primary/15 text-primary ring-2 ring-primary',
                  i > stepIndex && 'bg-muted text-muted-foreground',
                )}
              >
                {i < stepIndex ? <Icon name="Check" className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden font-medium sm:inline">{s.label}</span>
            </li>
            {i < STEPS.length - 1 && (
              <li className="h-px w-6 bg-border sm:w-12" />
            )}
          </React.Fragment>
        ))}
      </ol>

      {/* Paso 1: Formato */}
      {step === 'format' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FORMAT_DEFS.map((f) => (
            <button
              key={f.id}
              onClick={() => selectFormat(f.id)}
              className="group flex flex-col items-start gap-3 rounded-lg border bg-card p-5 text-left transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon name={f.icon} className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Paso 2: Plantilla o desde cero */}
      {step === 'source' && format && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('format')}>
            <Icon name="ChevronLeft" className="h-4 w-4" />
            Cambiar formato
          </Button>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Desde cero */}
            <button
              onClick={() => chooseTemplate(null)}
              className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="FilePlus2" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Comenzar desde cero</p>
                <p className="text-xs text-muted-foreground">
                  Lienzo en blanco para este formato.
                </p>
              </div>
            </button>

            {templatesLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[180px] rounded-lg" />
              ))}

            {!templatesLoading &&
              templates?.map((t) => (
                <button
                  key={t.id}
                  onClick={() => chooseTemplate(t)}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border text-left transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex h-24 items-center justify-center bg-gradient-to-br from-primary/10 to-accent">
                    <Icon
                      name={FORMAT_DEFS.find((f) => f.id === t.format)?.icon ?? 'FileText'}
                      className="h-8 w-8 text-primary/70"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-sm font-medium group-hover:text-primary">
                      {t.name}
                    </p>
                    {t.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {t.description}
                      </p>
                    )}
                    {t.is_official && (
                      <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <Icon name="BadgeCheck" className="h-3 w-3" /> Oficial
                      </span>
                    )}
                  </div>
                </button>
              ))}

            {!templatesLoading && (templates?.length ?? 0) === 0 && (
              <div className="col-span-full rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No hay plantillas para este formato todavía. Puedes comenzar
                desde cero.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paso 3: Detalles */}
      {step === 'details' && format && (
        <div className="max-w-xl space-y-5">
          <Button variant="ghost" size="sm" onClick={() => setStep('source')}>
            <Icon name="ChevronLeft" className="h-4 w-4" />
            Volver
          </Button>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon
                  name={FORMAT_DEFS.find((f) => f.id === format)?.icon ?? 'FileText'}
                  className="h-4 w-4 text-primary"
                />
                {FORMAT_DEFS.find((f) => f.id === format)?.label}
                <span>·</span>
                {fromScratch ? 'Desde cero' : `Plantilla: ${template?.name}`}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título del material *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Protocolo de higiene de manos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descripción</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objetivo y audiencia del material…"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => navigate('/proyectos')}>
                  Cancelar
                </Button>
                <Button
                  onClick={onCreate}
                  disabled={!title.trim() || createProject.isPending}
                >
                  {createProject.isPending ? 'Creando…' : 'Crear y editar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
