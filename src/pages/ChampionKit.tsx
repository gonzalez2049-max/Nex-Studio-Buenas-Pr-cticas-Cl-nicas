import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleHero } from '@/components/common/ModuleHero'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { Icon } from '@/components/common/Icon'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useResources } from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { MODULES } from '@/lib/modules'
import { cn } from '@/lib/utils'
import type { Resource } from '@/types/database'

/* ---------------------------------------------------------------- guías --- */

const GUIDES = [
  { id: 'LPP', label: 'LPP', icon: 'ShieldCheck', color: '#0ea5e9' },
  { id: 'Accesos vasculares', label: 'Accesos vasculares', icon: 'Syringe', color: '#14b8a6' },
  { id: 'Dolor', label: 'Dolor', icon: 'Activity', color: '#fb7185' },
  { id: 'Caídas', label: 'Caídas', icon: 'TriangleAlert', color: '#f59e0b' },
] as const

type GuideId = (typeof GUIDES)[number]['id']

/* ----------------------------------------------------------- componentes --- */

interface KitComponent {
  id: string
  label: string
  icon: string
  desc: string
}

const COMPONENTS: KitComponent[] = [
  { id: 'portada', label: 'Portada', icon: 'BookOpen', desc: 'Cubierta e identidad del kit.' },
  { id: 'mensaje', label: 'Mensaje clave', icon: 'MessageSquareQuote', desc: 'La idea central en una frase.' },
  { id: 'capsula', label: 'Cápsula', icon: 'Clapperboard', desc: 'Contenido breve de lectura rápida.' },
  { id: 'tarjeta', label: 'Tarjeta', icon: 'CreditCard', desc: 'Recordatorio de bolsillo.' },
  { id: 'checklist', label: 'Checklist', icon: 'ListChecks', desc: 'Lista de verificación editable.' },
  { id: 'afiche', label: 'Afiche', icon: 'Image', desc: 'Pieza mural para el servicio.' },
  { id: 'accion', label: 'Acción semanal', icon: 'CalendarCheck', desc: 'El reto de la semana.' },
  { id: 'referencias', label: 'Referencias', icon: 'Library', desc: 'Fuentes y evidencia.' },
]

interface KitState {
  order: string[]
  hidden: string[]
}

function loadState(guide: GuideId): KitState {
  try {
    const raw = localStorage.getItem(`nex-kit-${guide}`)
    if (raw) return JSON.parse(raw) as KitState
  } catch {
    /* noop */
  }
  return { order: COMPONENTS.map((c) => c.id), hidden: [] }
}

function svgFor(guide: GuideId, comp: KitComponent, color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <rect width="800" height="1000" fill="#ffffff"/>
    <rect width="800" height="240" fill="${color}"/>
    <text x="48" y="120" font-family="Arial" font-size="26" font-weight="700" fill="#ffffff">KIT CHAMPION · ${guide}</text>
    <text x="48" y="180" font-family="Arial" font-size="52" font-weight="800" fill="#ffffff">${comp.label}</text>
    <text x="48" y="340" font-family="Arial" font-size="28" fill="#0f172a">${comp.desc}</text>
    <rect x="48" y="400" width="704" height="2" fill="#e2e8f0"/>
    <text x="48" y="470" font-family="Arial" font-size="20" fill="#64748b">Componente editable del kit · UBPC</text>
  </svg>`
}

function download(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/* ------------------------------------------------------------------ page --- */

export function ChampionKitPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [guide, setGuide] = React.useState<GuideId>('LPP')
  const [state, setState] = React.useState<KitState>(() => loadState('LPP'))

  const { data: resources, isLoading } = useResources(true, guide)
  const guideDef = GUIDES.find((g) => g.id === guide)!

  React.useEffect(() => {
    setState(loadState(guide))
  }, [guide])

  const persist = (next: KitState) => {
    setState(next)
    try {
      localStorage.setItem(`nex-kit-${guide}`, JSON.stringify(next))
    } catch {
      /* noop */
    }
  }

  const ordered = state.order
    .map((id) => COMPONENTS.find((c) => c.id === id))
    .filter((c): c is KitComponent => Boolean(c))
  const visible = ordered.filter((c) => !state.hidden.includes(c.id))

  const move = (id: string, dir: -1 | 1) => {
    const idx = state.order.indexOf(id)
    const target = idx + dir
    if (target < 0 || target >= state.order.length) return
    const order = [...state.order]
    ;[order[idx], order[target]] = [order[target], order[idx]]
    persist({ ...state, order })
  }

  const toggleHidden = (id: string) => {
    const hidden = state.hidden.includes(id)
      ? state.hidden.filter((h) => h !== id)
      : [...state.hidden, id]
    persist({ ...state, hidden })
  }

  const downloadKit = () => {
    if (visible.length === 0) return
    visible.forEach((c) => download(svgFor(guide, c, guideDef.color), `kit-${guide}-${c.id}.svg`))
    toast({ variant: 'success', title: 'Kit descargado', description: `${visible.length} componentes.` })
  }

  return (
    <>
      <ModuleHero
        module={MODULES.kit}
        eyebrow="Adopción de buenas prácticas"
        title="Kit Champion"
        subtitle="Paquete por línea de cuidado. Edita, ordena, oculta y descarga cada componente o el kit completo."
        compact
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate(`/crear?tema=${encodeURIComponent(guide)}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ color: MODULES.kit.color }}
            >
              <Icon name="PenTool" className="h-4 w-4" />
              Editar kit completo
            </button>
            <button
              onClick={downloadKit}
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-transform hover:-translate-y-0.5"
            >
              <Icon name="Download" className="h-4 w-4" />
              Descargar kit
            </button>
          </div>
        }
      />

      <ConfigNotice />

      {/* Selector de guía */}
      <div className="flex flex-wrap gap-2">
        {GUIDES.map((g) => {
          const active = g.id === guide
          return (
            <button
              key={g.id}
              onClick={() => setGuide(g.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                active ? 'text-white' : 'hover:bg-accent',
              )}
              style={active ? { background: g.color, borderColor: g.color } : { color: g.color }}
            >
              <Icon name={g.icon} className="h-4 w-4" />
              {g.label}
            </button>
          )
        })}
      </div>

      {/* Componentes del kit */}
      <div>
        <p className="mb-3 text-sm font-semibold text-muted-foreground">
          Componentes del kit · {guideDef.label}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ordered.map((c, i) => {
            const hidden = state.hidden.includes(c.id)
            return (
              <Card
                key={c.id}
                className={cn(
                  'flex flex-col overflow-hidden rounded-2xl surface transition-all',
                  hidden && 'opacity-55',
                )}
              >
                <div
                  className="flex h-24 items-center justify-between px-4"
                  style={{ background: `linear-gradient(135deg, ${guideDef.color}22, ${guideDef.color}0d)` }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `${guideDef.color}26`, color: guideDef.color }}
                  >
                    <Icon name={c.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {i + 1}/{ordered.length}
                  </span>
                </div>
                <CardContent className="flex flex-1 flex-col gap-1 p-4">
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                  <div className="mt-3 flex items-center gap-1">
                    <IconBtn title="Subir" icon="ChevronUp" onClick={() => move(c.id, -1)} disabled={i === 0} />
                    <IconBtn title="Bajar" icon="ChevronDown" onClick={() => move(c.id, 1)} disabled={i === ordered.length - 1} />
                    <IconBtn title={hidden ? 'Mostrar' : 'Ocultar'} icon={hidden ? 'EyeOff' : 'Eye'} onClick={() => toggleHidden(c.id)} />
                    <div className="ml-auto flex items-center gap-1">
                      <IconBtn title="Editar" icon="PenTool" onClick={() => navigate(`/crear?tema=${encodeURIComponent(guide)}`)} />
                      <IconBtn title="Descargar" icon="Download" onClick={() => download(svgFor(guide, c, guideDef.color), `kit-${guide}-${c.id}.svg`)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recursos de la guía */}
      <div>
        <p className="mb-3 text-sm font-semibold text-muted-foreground">
          Recursos de {guideDef.label}
        </p>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : resources && resources.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} color={guideDef.color} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No hay recursos publicados para esta guía todavía.
          </p>
        )}
      </div>
    </>
  )
}

function IconBtn({
  icon,
  title,
  onClick,
  disabled,
}: {
  icon: string
  title: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
    >
      <Icon name={icon} className="h-4 w-4" />
    </button>
  )
}

function ResourceCard({ resource, color }: { resource: Resource; color: string }) {
  return (
    <Card className="h-full rounded-2xl surface">
      <CardContent className="flex h-full flex-col gap-2 p-5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${color}1f`, color }}
        >
          <Icon name="FileText" className="h-4 w-4" />
        </span>
        <p className="mt-1 text-sm font-semibold">{resource.title}</p>
        {resource.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{resource.description}</p>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium" style={{ color }}>
              Acciones <Icon name="ChevronDown" className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => resource.url && window.open(resource.url, '_blank')}>
              <Icon name="ExternalLink" className="h-4 w-4" />
              Abrir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}
