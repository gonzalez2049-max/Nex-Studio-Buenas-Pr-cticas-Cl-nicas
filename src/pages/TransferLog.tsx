import * as React from 'react'
import { ModuleHero } from '@/components/common/ModuleHero'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateTransferRecord,
  useProjects,
  useTransferRecords,
} from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import { FORMAT_LABELS } from '@/lib/domain'
import { MODULES } from '@/lib/modules'
import { cn } from '@/lib/utils'
import { shortDate } from '@/lib/format'

const C = MODULES.transferencia.color

const MODALIDADES = ['Sesión presencial', 'Correo institucional', 'Intranet', 'WhatsApp / mensajería', 'Cartelera física', 'Redes sociales', 'Otra']
const GUIAS = ['LPP', 'Accesos vasculares', 'Dolor', 'Caídas', 'Higiene de manos', 'Otra']

const empty = {
  projectId: '',
  guia: '',
  unidad: '',
  actividad: '',
  participantes: '',
  responsable: '',
  modalidad: '',
  resultado: '',
  evidencia: '',
  validado: false,
}

export function TransferLogPage() {
  const { toast } = useToast()
  const { data: records, isLoading } = useTransferRecords()
  const { data: published } = useProjects({ status: 'publicado' })
  const create = useCreateTransferRecord()

  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({ ...empty })
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  /* Indicadores automáticos */
  const total = records?.length ?? 0
  const totalReach = records?.reduce((a, r) => a + (r.reach ?? 0), 0) ?? 0
  const avg = total ? Math.round(totalReach / total) : 0
  const validadas = (records ?? []).filter((r) => (r.notes ?? '').includes('Validación:') && !(r.notes ?? '').includes('Validación: —')).length
  const byModalidad = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const r of records ?? []) m.set(r.channel, (m.get(r.channel) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [records])

  const submit = async () => {
    if (!form.projectId || !form.modalidad) return
    const notes = [
      form.actividad && `Actividad: ${form.actividad}`,
      form.responsable && `Responsable: ${form.responsable}`,
      form.resultado && `Resultado: ${form.resultado}`,
      form.evidencia && `Evidencia: ${form.evidencia}`,
      `Validación: ${form.validado ? 'Validado por coordinación' : '—'}`,
    ].filter(Boolean).join(' · ')
    try {
      await create.mutateAsync({
        project_id: form.projectId,
        channel: form.modalidad,
        audience: [form.unidad, form.guia].filter(Boolean).join(' · ') || undefined,
        reach: form.participantes ? Number(form.participantes) : 0,
        notes,
      })
      toast({ variant: 'success', title: 'Transferencia registrada' })
      setOpen(false)
      setForm({ ...empty })
    } catch (e) {
      toast({ variant: 'destructive', title: 'No se pudo registrar', description: e instanceof Error ? e.message : 'Conecta Supabase para guardar.' })
    }
  }

  return (
    <>
      <ModuleHero
        module={MODULES.transferencia}
        eyebrow="Trazabilidad de la difusión"
        title="Registro de transferencia"
        subtitle="Evidencia clara del alcance y la validación de cada material difundido."
        compact
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5" style={{ color: C }}>
                <Icon name="Plus" className="h-4 w-4" />
                Registrar transferencia
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar transferencia</DialogTitle>
                <DialogDescription>Breve y claro: qué material, a quién y con qué resultado.</DialogDescription>
              </DialogHeader>

              <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 scrollbar-thin">
                <Field label="Material publicado *">
                  <Select value={form.projectId} onValueChange={(v) => set('projectId', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                    <SelectContent>
                      {(published ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                      {(published?.length ?? 0) === 0 && (
                        <div className="px-2 py-3 text-sm text-muted-foreground">No hay materiales publicados.</div>
                      )}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Guía / línea">
                    <Select value={form.guia} onValueChange={(v) => set('guia', v)}>
                      <SelectTrigger><SelectValue placeholder="Guía…" /></SelectTrigger>
                      <SelectContent>
                        {GUIAS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Unidad / servicio">
                    <Input value={form.unidad} onChange={(e) => set('unidad', e.target.value)} placeholder="Ej. UCI" />
                  </Field>
                </div>

                <Field label="Actividad">
                  <Input value={form.actividad} onChange={(e) => set('actividad', e.target.value)} placeholder="Ej. Taller de reposicionamiento" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Participantes">
                    <Input type="number" min={0} value={form.participantes} onChange={(e) => set('participantes', e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="Responsable">
                    <Input value={form.responsable} onChange={(e) => set('responsable', e.target.value)} placeholder="Nombre" />
                  </Field>
                </div>

                <Field label="Modalidad *">
                  <Select value={form.modalidad} onValueChange={(v) => set('modalidad', v)}>
                    <SelectTrigger><SelectValue placeholder="Modalidad de difusión…" /></SelectTrigger>
                    <SelectContent>
                      {MODALIDADES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Resultado">
                  <Textarea value={form.resultado} onChange={(e) => set('resultado', e.target.value)} placeholder="Ej. 100% de asistencia; se resolvieron dudas." rows={2} />
                </Field>

                <Field label="Evidencia">
                  <Input value={form.evidencia} onChange={(e) => set('evidencia', e.target.value)} placeholder="Ej. lista de firmas, fotografías, enlace" />
                </Field>

                <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <input type="checkbox" checked={form.validado} onChange={(e) => set('validado', e.target.checked)} />
                  Validación por coordinación
                </label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button disabled={!form.projectId || !form.modalidad || create.isPending} onClick={submit}>
                  Registrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <ConfigNotice />

      {/* Indicadores automáticos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicator icon="Share2" label="Transferencias" value={total} />
        <Indicator icon="Users" label="Alcance acumulado" value={totalReach} />
        <Indicator icon="TrendingUp" label="Alcance medio" value={avg} />
        <Indicator icon="BadgeCheck" label="Validadas" value={validadas} />
      </div>

      {byModalidad.length > 0 && (
        <div className="rounded-2xl border bg-card p-5 surface">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Por modalidad</p>
          <div className="space-y-2.5">
            {byModalidad.map(([m, n]) => (
              <div key={m} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm">{m}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${(n / total) * 100}%`, background: C }} />
                </div>
                <span className="w-6 text-right text-xs font-medium tabular-nums">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando registro…</p>
      ) : records && records.length > 0 ? (
        <Card className="rounded-2xl surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Material</th>
                  <th className="px-4 py-3 font-medium">Guía · unidad</th>
                  <th className="px-4 py-3 font-medium">Modalidad</th>
                  <th className="px-4 py-3 font-medium">Participantes</th>
                  <th className="px-4 py-3 font-medium">Validación</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const validated = (r.notes ?? '').includes('Validación:') && !(r.notes ?? '').includes('Validación: —')
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.project?.title ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{r.project ? FORMAT_LABELS[r.project.format] : ''}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.audience ?? '—'}</td>
                      <td className="px-4 py-3">{r.channel}</td>
                      <td className="px-4 py-3 tabular-nums">{r.reach}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', validated ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
                          <Icon name={validated ? 'BadgeCheck' : 'Clock'} className="h-3 w-3" />
                          {validated ? 'Validada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{shortDate(r.transferred_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState icon="Share2" title="Sin transferencias registradas" description="Registra la primera difusión de un material publicado." />
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Indicator({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <Card className="rounded-2xl surface">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${C}1f`, color: C }}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
