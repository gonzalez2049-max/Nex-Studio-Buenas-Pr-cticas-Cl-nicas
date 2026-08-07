import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ModuleHero } from '@/components/common/ModuleHero'
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
import { MODULES } from '@/lib/modules'
import { THEMES, findTheme, applyThemeToDoc, type EduTheme } from '@/lib/themes'
import { getFormatDef } from '@/editor/formats'
import { cn } from '@/lib/utils'
import type { Template } from '@/types/database'

type Step = 'theme' | 'format' | 'source' | 'details'

const STEPS: { id: Step; label: string }[] = [
  { id: 'theme', label: 'Espacio educativo' },
  { id: 'format', label: 'Formato' },
  { id: 'source', label: 'Plantilla' },
  { id: 'details', label: 'Detalles' },
]

export function CreateMaterialPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [params] = useSearchParams()
  const createProject = useCreateProject()

  const preTheme = findTheme(params.get('tema'))
  const [step, setStep] = React.useState<Step>(preTheme ? 'format' : 'theme')
  const [theme, setTheme] = React.useState<EduTheme | null>(preTheme ?? null)
  const [format, setFormat] = React.useState<MaterialFormat | null>(null)
  const [template, setTemplate] = React.useState<Template | null>(null)
  const [source, setSource] = React.useState<'scratch' | 'base' | 'template' | null>(null)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')

  const { data: templates, isLoading: templatesLoading } = useTemplates(
    format ?? undefined,
  )
  // Plantillas de base de datos adaptadas al tema (por categoría) + oficiales.
  const adapted = React.useMemo(
    () =>
      (templates ?? []).filter(
        (t) =>
          !theme ||
          theme.id === 'General' ||
          t.category === theme.id ||
          t.is_official,
      ),
    [templates, theme],
  )

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const formatLabel = format ? FORMAT_DEFS.find((f) => f.id === format)?.label ?? '' : ''

  const chooseTheme = (t: EduTheme) => {
    setTheme(t)
    setStep('format')
  }
  const chooseFormat = (f: MaterialFormat) => {
    setFormat(f)
    setTemplate(null)
    setSource(null)
    setStep('source')
  }
  const chooseSource = (s: 'scratch' | 'base' | 'template', t?: Template) => {
    setSource(s)
    setTemplate(t ?? null)
    const base =
      theme && theme.id !== 'General'
        ? `${theme.short} · ${formatLabel}`
        : formatLabel
    setTitle(t ? t.name : base)
    setStep('details')
  }

  const onCreate = async () => {
    if (!format || !title.trim()) return
    let content: Record<string, unknown> | undefined
    if (source === 'template' && template) {
      content = template.content as Record<string, unknown>
    } else if (source === 'base' && theme) {
      content = applyThemeToDoc(getFormatDef(format).createDocument(), theme) as unknown as Record<string, unknown>
    } else {
      content = undefined // desde cero: el editor genera el documento base del formato
    }
    const tags = theme && theme.id !== 'General' ? [theme.id] : []
    try {
      const project = await createProject.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        format,
        template_id: template?.id ?? null,
        content,
        tags,
      })
      toast({ variant: 'success', title: 'Material creado', description: 'Se guardó como borrador.' })
      navigate(`/proyectos/${project.id}`)
    } catch (e) {
      toast({ variant: 'destructive', title: 'No se pudo crear', description: e instanceof Error ? e.message : 'Conecta Supabase para guardar.' })
    }
  }

  return (
    <>
      <ModuleHero
        module={MODULES.crear}
        eyebrow="Nuevo material"
        title="Crear material"
        subtitle="Elige el espacio educativo, el formato y la plantilla. Cada espacio ofrece todos los formatos, vinculados a la temática."
        compact
      />

      {/* Pasos */}
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <li className={cn('flex items-center gap-2', i <= stepIndex ? 'text-foreground' : 'text-muted-foreground')}>
              <button
                onClick={() => i < stepIndex && setStep(s.id)}
                disabled={i > stepIndex}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  i < stepIndex && 'bg-primary text-primary-foreground',
                  i === stepIndex && 'bg-primary/15 text-primary ring-2 ring-primary',
                  i > stepIndex && 'bg-muted text-muted-foreground',
                )}
              >
                {i < stepIndex ? <Icon name="Check" className="h-3 w-3" /> : i + 1}
              </button>
              <span className="hidden font-medium sm:inline">{s.label}</span>
            </li>
            {i < STEPS.length - 1 && <li className="h-px w-6 bg-border sm:w-10" />}
          </React.Fragment>
        ))}
        {theme && step !== 'theme' && (
          <li className="ml-auto">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ background: theme.color }}
            >
              <Icon name={theme.icon} className="h-3.5 w-3.5" />
              {theme.short}
            </span>
          </li>
        )}
      </ol>

      {/* Paso 1: Espacio educativo */}
      {step === 'theme' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => chooseTheme(t)}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-5 text-left surface transition-all hover:-translate-y-0.5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)` }}>
                <Icon name={t.icon} className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">Todos los formatos disponibles</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Paso 2: Formato (todos) */}
      {step === 'format' && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('theme')}>
            <Icon name="ChevronLeft" className="h-4 w-4" />
            Cambiar espacio
          </Button>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FORMAT_DEFS.map((f) => (
              <button
                key={f.id}
                onClick={() => chooseFormat(f.id)}
                className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left surface transition-all hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon name={f.icon} className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 3: Plantilla adaptada al tema */}
      {step === 'source' && format && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('format')}>
            <Icon name="ChevronLeft" className="h-4 w-4" />
            Cambiar formato
          </Button>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {theme && theme.id !== 'General' && (
              <button
                onClick={() => chooseSource('base')}
                className="flex h-full min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border-2 p-6 text-center transition-all hover:-translate-y-0.5"
                style={{ borderColor: theme.color }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: theme.color }}>
                  <Icon name={theme.icon} className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Plantilla base de {theme.short}</p>
                  <p className="text-xs text-muted-foreground">{formatLabel} adaptado a la temática</p>
                </div>
              </button>
            )}

            <button
              onClick={() => chooseSource('scratch')}
              className="flex h-full min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="FilePlus2" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Comenzar desde cero</p>
                <p className="text-xs text-muted-foreground">Lienzo base de {formatLabel}</p>
              </div>
            </button>

            {templatesLoading &&
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}

            {!templatesLoading &&
              adapted.map((t) => (
                <button
                  key={t.id}
                  onClick={() => chooseSource('template', t)}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border text-left surface transition-all hover:-translate-y-0.5"
                >
                  <div className="flex h-20 items-center justify-center bg-gradient-to-br from-primary/10 to-accent">
                    <Icon name={FORMAT_DEFS.find((f) => f.id === t.format)?.icon ?? 'FileText'} className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-sm font-medium">{t.name}</p>
                    {t.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>}
                    {t.is_official && (
                      <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <Icon name="BadgeCheck" className="h-3 w-3" /> Oficial
                      </span>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Paso 4: Detalles */}
      {step === 'details' && format && (
        <div className="max-w-xl space-y-5">
          <Button variant="ghost" size="sm" onClick={() => setStep('source')}>
            <Icon name="ChevronLeft" className="h-4 w-4" />
            Volver
          </Button>
          <Card className="rounded-2xl surface">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {theme && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: theme.color }}>
                    <Icon name={theme.icon} className="h-3 w-3" />
                    {theme.short}
                  </span>
                )}
                <Icon name={FORMAT_DEFS.find((f) => f.id === format)?.icon ?? 'FileText'} className="h-4 w-4 text-primary" />
                {formatLabel}
                <span>·</span>
                {source === 'template' ? `Plantilla: ${template?.name}` : source === 'base' ? 'Plantilla base del tema' : 'Desde cero'}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título del material *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Prevención de LPP" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descripción</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Objetivo y audiencia del material…" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => navigate('/proyectos')}>Cancelar</Button>
                <Button onClick={onCreate} disabled={!title.trim() || createProject.isPending}>
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
