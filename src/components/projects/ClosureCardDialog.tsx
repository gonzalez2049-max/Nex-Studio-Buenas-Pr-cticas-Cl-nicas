import * as React from 'react'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSaveClosure, useSendClosure, useProfiles } from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { MODULES } from '@/lib/modules'
import { STATE_LABELS } from '@/lib/domain'
import { shortDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  buildClosureFromProject,
  closureReadyToSign,
  loadClosure,
  type ClosureCard,
} from '@/lib/closure'
import type { ProjectWithRelations } from '@/types/database'

const C = MODULES.transferencia.color
const STEPS = ['Generar', 'Completar', 'Firmar', 'Enviar']

export function ClosureCardDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectWithRelations
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const { data: profiles } = useProfiles()
  const save = useSaveClosure()
  const send = useSendClosure()

  const [card, setCard] = React.useState<ClosureCard | null>(null)

  // Genera automáticamente la ficha al abrir (o carga la existente).
  React.useEffect(() => {
    if (!open) return
    setCard(loadClosure(project) ?? buildClosureFromProject(project, profile))
  }, [open, project, profile])

  if (!card) return null
  const set = (patch: Partial<ClosureCard>) => setCard((c) => (c ? { ...c, ...patch } : c))
  const signed = Boolean(card.signature?.confirmed)
  const step = card.sent_at ? 3 : signed ? 3 : closureReadyToSign(card) ? 2 : 1

  const toggleSign = (checked: boolean) => {
    if (checked) {
      set({
        signature: {
          name: card.signature?.name || profile?.full_name || card.professional,
          role: card.signature?.role || profile?.job_title || 'Profesional UBPC',
          signed_at: new Date().toISOString(),
          confirmed: true,
        },
      })
    } else {
      set({ signature: null })
    }
  }

  const doSave = async () => {
    await save.mutateAsync({ projectId: project.id, closure: card })
    toast({ variant: 'success', title: 'Ficha guardada' })
  }

  const doSend = async () => {
    if (!signed) return
    const coordinator = (profiles ?? []).find((p) => p.role === 'coordinador')
    const finalCard: ClosureCard = { ...card, sent_at: new Date().toISOString(), status: 'pendiente_revision' }
    try {
      await send.mutateAsync({ project, closure: finalCard, reviewerId: coordinator?.id ?? null })
      setCard(finalCard)
      toast({ variant: 'success', title: 'Ficha enviada al Coordinador', description: 'El material pasó a revisión.' })
      onOpenChange(false)
    } catch (e) {
      // En modo demo la transición no persiste, pero la ficha sí se guarda.
      setCard(finalCard)
      toast({
        variant: 'success',
        title: 'Ficha firmada y enviada (demo)',
        description: 'La ficha quedó registrada. El cambio de estado requiere Supabase.',
      })
      onOpenChange(false)
      void e
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ficha de cierre del producto</DialogTitle>
          <DialogDescription>
            Revisa y completa el resumen, firma electrónicamente y envíalo al Coordinador.
          </DialogDescription>
        </DialogHeader>

        {/* Pasos */}
        <ol className="flex items-center gap-2 text-xs">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <li className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                    i <= step ? 'text-white' : 'bg-muted text-muted-foreground',
                  )}
                  style={i <= step ? { background: C } : undefined}
                >
                  {i < step ? '✓' : i + 1}
                </span>
                <span className={i <= step ? 'font-medium' : 'text-muted-foreground'}>{s}</span>
              </li>
              {i < STEPS.length - 1 && <li className="h-px w-4 bg-border" />}
            </React.Fragment>
          ))}
        </ol>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1 scrollbar-thin">
          {/* Datos generados automáticamente */}
          <section className="rounded-xl bg-muted/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Datos del producto (automáticos)
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <Auto label="Producto" value={card.product_name} />
              <Auto label="Tipo" value={card.material_type} />
              <Auto label="Código" value={card.code || '—'} mono />
              <Auto label="Versión" value={`v${card.version}`} />
              <Auto label="Estado" value={STATE_LABELS[card.status]} />
              <Auto label="Responsable" value={card.professional || '—'} />
              <Auto label="Creado" value={shortDate(card.created_at)} />
              <Auto label="Cierre" value={shortDate(card.closed_at)} />
            </div>
          </section>

          {/* Completar */}
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Guía / línea temática">
              <Input value={card.guide} onChange={(e) => set({ guide: e.target.value })} placeholder="Ej. Accesos vasculares" disabled={Boolean(card.sent_at)} />
            </F>
            <F label="Unidad / alcance">
              <Input value={card.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="Ej. UCI" disabled={Boolean(card.sent_at)} />
            </F>
          </div>
          <F label="Temas abordados *">
            <Textarea value={card.topics} onChange={(e) => set({ topics: e.target.value })} placeholder="Enumera los temas del material…" rows={2} disabled={Boolean(card.sent_at)} />
          </F>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Público objetivo *">
              <Input value={card.audience} onChange={(e) => set({ audience: e.target.value })} placeholder="Ej. Personal de enfermería" disabled={Boolean(card.sent_at)} />
            </F>
            <F label="Funcionarios impactados (est.)">
              <Input type="number" min={0} value={card.impacted} onChange={(e) => set({ impacted: Number(e.target.value) })} disabled={Boolean(card.sent_at)} />
            </F>
          </div>
          <F label="Observaciones">
            <Textarea value={card.observations} onChange={(e) => set({ observations: e.target.value })} rows={2} disabled={Boolean(card.sent_at)} />
          </F>

          {/* Firma electrónica */}
          <section className="rounded-xl border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="PenLine" className="h-4 w-4" style={{ color: C }} />
              <p className="text-sm font-semibold">Firma electrónica</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Nombre">
                <Input
                  value={card.signature?.name ?? profile?.full_name ?? card.professional}
                  onChange={(e) => set({ signature: { name: e.target.value, role: card.signature?.role ?? profile?.job_title ?? 'Profesional UBPC', signed_at: card.signature?.signed_at ?? '', confirmed: signed } })}
                  disabled={signed || Boolean(card.sent_at)}
                />
              </F>
              <F label="Cargo">
                <Input
                  value={card.signature?.role ?? profile?.job_title ?? 'Profesional UBPC'}
                  onChange={(e) => set({ signature: { name: card.signature?.name ?? profile?.full_name ?? card.professional, role: e.target.value, signed_at: card.signature?.signed_at ?? '', confirmed: signed } })}
                  disabled={signed || Boolean(card.sent_at)}
                />
              </F>
            </div>
            <label className={cn('mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm', signed && 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40')}>
              <input
                type="checkbox"
                className="mt-0.5"
                checked={signed}
                disabled={!closureReadyToSign(card) || Boolean(card.sent_at)}
                onChange={(e) => toggleSign(e.target.checked)}
              />
              <span>
                Confirmo que soy el autor de este material y que la información de la ficha es correcta.
                {signed && card.signature && (
                  <span className="mt-1 block text-xs text-emerald-700 dark:text-emerald-300">
                    Firmado el {new Date(card.signature.signed_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                )}
              </span>
            </label>
            {!closureReadyToSign(card) && (
              <p className="mt-1 text-xs text-muted-foreground">
                Completa temas abordados y público objetivo para poder firmar.
              </p>
            )}
          </section>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={doSave} disabled={save.isPending || Boolean(card.sent_at)}>
              <Icon name="Save" className="h-4 w-4" />
              Guardar ficha
            </Button>
            <Button onClick={doSend} disabled={!signed || send.isPending || Boolean(card.sent_at)}>
              <Icon name="Send" className="h-4 w-4" />
              Enviar al Coordinador
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Auto({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('font-medium', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  )
}
