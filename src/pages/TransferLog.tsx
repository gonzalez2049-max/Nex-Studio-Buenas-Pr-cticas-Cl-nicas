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
import { shortDate } from '@/lib/format'

const CHANNELS = [
  'Sesión presencial',
  'Correo institucional',
  'Intranet',
  'WhatsApp / mensajería',
  'Cartelera física',
  'Redes sociales',
  'Otro',
]

export function TransferLogPage() {
  const { toast } = useToast()
  const { data: records, isLoading } = useTransferRecords()
  const { data: published } = useProjects({ status: 'publicado' })
  const create = useCreateTransferRecord()

  const [open, setOpen] = React.useState(false)
  const [projectId, setProjectId] = React.useState('')
  const [channel, setChannel] = React.useState('')
  const [audience, setAudience] = React.useState('')
  const [reach, setReach] = React.useState('')
  const [notes, setNotes] = React.useState('')

  const totalReach =
    records?.reduce((acc, r) => acc + (r.reach ?? 0), 0) ?? 0

  const submit = async () => {
    if (!projectId || !channel) return
    try {
      await create.mutateAsync({
        project_id: projectId,
        channel,
        audience: audience.trim() || undefined,
        reach: reach ? Number(reach) : 0,
        notes: notes.trim() || undefined,
      })
      toast({ variant: 'success', title: 'Transferencia registrada' })
      setOpen(false)
      setProjectId('')
      setChannel('')
      setAudience('')
      setReach('')
      setNotes('')
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'No se pudo registrar',
        description: e instanceof Error ? e.message : 'Error desconocido',
      })
    }
  }

  return (
    <>
      <ModuleHero
        module={MODULES.transferencia}
        eyebrow="Trazabilidad"
        title="Registro de transferencia"
        subtitle="Evidencia de la difusión y el alcance de los materiales publicados."
        compact
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ color: MODULES.transferencia.color }}
              >
                <Icon name="Plus" className="h-4 w-4" />
                Registrar transferencia
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar transferencia</DialogTitle>
                <DialogDescription>
                  Documenta dónde y a quién se difundió un material publicado.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Material publicado *</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un material…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(published ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                      {(published?.length ?? 0) === 0 && (
                        <div className="px-2 py-3 text-sm text-muted-foreground">
                          No hay materiales publicados aún.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Canal *</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Canal de difusión…" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Audiencia</Label>
                    <Input
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="Ej. Enfermería"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alcance (personas)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={reach}
                      onChange={(e) => setReach(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones de la transferencia…"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={!projectId || !channel || create.isPending}
                  onClick={submit}
                >
                  Registrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <ConfigNotice />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-semibold tabular-nums">
              {records?.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Transferencias registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-semibold tabular-nums">{totalReach}</p>
            <p className="text-xs text-muted-foreground">Alcance acumulado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-semibold tabular-nums">
              {published?.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Materiales publicados
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando registro…</p>
      ) : records && records.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Material</th>
                  <th className="px-4 py-3 font-medium">Canal</th>
                  <th className="px-4 py-3 font-medium">Audiencia</th>
                  <th className="px-4 py-3 font-medium">Alcance</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {r.project?.title ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.project ? FORMAT_LABELS[r.project.format] : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">{r.channel}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.audience ?? '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.reach}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {shortDate(r.transferred_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon="Share2"
          title="Sin transferencias registradas"
          description="Registra la primera difusión de un material publicado."
        />
      )}
    </>
  )
}
