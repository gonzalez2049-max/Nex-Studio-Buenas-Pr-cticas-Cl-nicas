import * as React from 'react'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { MODULES } from '@/lib/modules'
import { STATE_LABELS } from '@/lib/domain'
import { shortDate } from '@/lib/format'
import type { ClosureCard } from '@/lib/closure'

const C = MODULES.transferencia.color

function dateTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

async function downloadPdf(card: ClosureCard, toast: ReturnType<typeof useToast>['toast']) {
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    let y = 56
    doc.setFillColor(16, 185, 129)
    doc.rect(0, 0, W, 90, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold').setFontSize(20)
    doc.text('Ficha de cierre del producto', 40, 48)
    doc.setFont('helvetica', 'normal').setFontSize(11)
    doc.text(`${card.code} · ${card.material_type}`, 40, 70)
    y = 130
    doc.setTextColor(15, 23, 42)

    const rows: [string, string][] = [
      ['Nombre del producto', card.product_name],
      ['Tipo de material', card.material_type],
      ['Guía / línea temática', card.guide || '—'],
      ['Temas abordados', card.topics || '—'],
      ['Público objetivo', card.audience || '—'],
      ['Funcionarios impactados (est.)', String(card.impacted)],
      ['Unidad / alcance', card.unit || '—'],
      ['Profesional responsable', card.professional || '—'],
      ['Código interno', card.code || '—'],
      ['Versión', String(card.version)],
      ['Estado', STATE_LABELS[card.status]],
      ['Creado', shortDate(card.created_at)],
      ['Cierre', shortDate(card.closed_at)],
      ['Enlace al material', card.material_link],
      ['Observaciones', card.observations || '—'],
    ]
    doc.setFontSize(10)
    for (const [k, v] of rows) {
      doc.setFont('helvetica', 'bold').text(`${k}:`, 40, y)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(v, W - 250)
      doc.text(lines, 230, y)
      y += Math.max(18, lines.length * 14)
      if (y > 720) {
        doc.addPage()
        y = 56
      }
    }

    y += 10
    doc.setDrawColor(203, 213, 225).line(40, y, W - 40, y)
    y += 24
    doc.setFont('helvetica', 'bold').setFontSize(12).text('Firma electrónica', 40, y)
    y += 20
    doc.setFontSize(10)
    const sig = card.signature
    const sigRows: [string, string][] = [
      ['Nombre', sig?.name ?? '—'],
      ['Cargo', sig?.role ?? '—'],
      ['Firmado', dateTime(sig?.signed_at ?? null)],
      ['Confirmación', sig?.confirmed ? 'Confirmado por el profesional' : 'Sin confirmar'],
      ['Enviado al Coordinador', dateTime(card.sent_at)],
    ]
    for (const [k, v] of sigRows) {
      doc.setFont('helvetica', 'bold').text(`${k}:`, 40, y)
      doc.setFont('helvetica', 'normal').text(v, 230, y)
      y += 18
    }
    doc.save(`ficha-cierre-${card.code || 'material'}.pdf`)
    toast({ variant: 'success', title: 'Ficha descargada (PDF)' })
  } catch (e) {
    toast({ variant: 'destructive', title: 'No se pudo generar el PDF', description: e instanceof Error ? e.message : 'Error' })
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium sm:text-right">{value}</span>
    </div>
  )
}

export function ClosureCardView({ card }: { card: ClosureCard }) {
  const { toast } = useToast()
  return (
    <div className="overflow-hidden rounded-2xl border bg-card surface">
      <div className="flex items-center justify-between p-4 text-white" style={{ background: `linear-gradient(135deg, ${C}, #34d399)` }}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Icon name="FileCheck2" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Ficha de cierre del producto</p>
            <p className="text-lg font-semibold leading-tight">{card.product_name}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => downloadPdf(card, toast)}>
          <Icon name="Download" className="h-4 w-4" />
          PDF
        </Button>
      </div>

      <div className="grid gap-x-8 p-5 sm:grid-cols-2">
        <Row label="Tipo de material" value={card.material_type} />
        <Row label="Código interno" value={<span className="font-mono text-xs">{card.code || '—'}</span>} />
        <Row label="Guía / línea" value={card.guide || '—'} />
        <Row label="Versión" value={`v${card.version}`} />
        <Row label="Estado" value={STATE_LABELS[card.status]} />
        <Row label="Creado" value={shortDate(card.created_at)} />
        <Row label="Cierre" value={shortDate(card.closed_at)} />
        <Row label="Profesional responsable" value={card.professional || '—'} />
        <Row label="Público objetivo" value={card.audience || '—'} />
        <Row label="Funcionarios impactados (est.)" value={<span className="tabular-nums">{card.impacted}</span>} />
        <Row label="Unidad / alcance" value={card.unit || '—'} />
        <Row label="Enlace al material" value={<a href={card.material_link} className="text-primary hover:underline">Abrir</a>} />
      </div>

      <div className="border-t px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Temas abordados</p>
        <p className="mt-1 text-sm">{card.topics || '—'}</p>
        {card.observations && (
          <>
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Observaciones</p>
            <p className="mt-1 text-sm">{card.observations}</p>
          </>
        )}
      </div>

      {/* Firma electrónica (registro textual, sin imagen) */}
      <div className="border-t bg-muted/40 px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon name="PenLine" className="h-4 w-4" style={{ color: C }} />
          <p className="text-sm font-semibold">Firma electrónica</p>
        </div>
        {card.signature?.confirmed ? (
          <div className="grid gap-x-8 sm:grid-cols-2">
            <Row label="Nombre" value={card.signature.name} />
            <Row label="Cargo" value={card.signature.role} />
            <Row label="Firmado" value={dateTime(card.signature.signed_at)} />
            <Row label="Confirmación" value={<span className="inline-flex items-center gap-1 text-emerald-600"><Icon name="BadgeCheck" className="h-4 w-4" />Confirmado</span>} />
            <Row label="Enviado al Coordinador" value={dateTime(card.sent_at)} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ficha aún sin firmar.</p>
        )}
      </div>
    </div>
  )
}
