import { useMemo } from 'react'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Icon } from '@/components/common/Icon'
import { useEditor } from '@/editor/store'
import { elementTypeLabel } from '@/editor/factory'
import type {
  ChartElement,
  EditorElement,
  TableElement,
  TextElement,
} from '@/editor/model'
import {
  ColorField,
  IconToggle,
  NumberField,
  Row,
  Section,
  Slider,
  TextInput,
} from '@/editor/components/controls'

const FONTS = ['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS', 'Courier New']

const ALIGN_BUTTONS: { id: string; icon: string; title: string }[] = [
  { id: 'left', icon: 'AlignHorizontalJustifyStart', title: 'Alinear izquierda' },
  { id: 'center-h', icon: 'AlignHorizontalJustifyCenter', title: 'Centrar horizontal' },
  { id: 'right', icon: 'AlignHorizontalJustifyEnd', title: 'Alinear derecha' },
  { id: 'top', icon: 'AlignVerticalJustifyStart', title: 'Alinear arriba' },
  { id: 'center-v', icon: 'AlignVerticalJustifyCenter', title: 'Centrar vertical' },
  { id: 'bottom', icon: 'AlignVerticalJustifyEnd', title: 'Alinear abajo' },
  { id: 'distribute-h', icon: 'AlignHorizontalSpaceBetween', title: 'Distribuir horizontal' },
  { id: 'distribute-v', icon: 'AlignVerticalSpaceBetween', title: 'Distribuir vertical' },
]

export function RightPanel() {
  const selectedIds = useEditor((s) => s.selectedIds)
  const page = useEditor((s) => s.currentPage())
  const selected = useMemo(
    () => page.elements.filter((e) => selectedIds.includes(e.id)),
    [page, selectedIds],
  )
  const update = useEditor((s) => s.updateSelected)
  const updateEl = useEditor((s) => s.updateElement)
  const align = useEditor((s) => s.align)
  const reorder = useEditor((s) => s.reorder)
  const duplicate = useEditor((s) => s.duplicateSelected)
  const remove = useEditor((s) => s.removeSelected)
  const toggleLock = useEditor((s) => s.toggleLockSelected)
  const group = useEditor((s) => s.groupSelected)
  const ungroup = useEditor((s) => s.ungroupSelected)
  const setBg = useEditor((s) => s.setPageBackground)

  const el = selected.length === 1 ? selected[0] : null
  const multi = selected.length > 1

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-l bg-background scrollbar-thin">
      {selected.length === 0 && (
        <>
          <Section title="Página">
            <Row>
              <ColorField value={page.background} onChange={setBg} label="Fondo" />
            </Row>
            <p className="pt-1 text-xs text-muted-foreground">
              Selecciona un elemento para editar sus propiedades.
            </p>
          </Section>
        </>
      )}

      {selected.length > 0 && (
        <>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium">
              {multi ? `${selected.length} elementos` : elementTypeLabel(el!)}
            </span>
            <button
              onClick={toggleLock}
              className="text-muted-foreground hover:text-foreground"
              title="Bloquear / desbloquear"
            >
              <Icon name={selected.some((s) => s.locked) ? 'Lock' : 'LockOpen'} className="h-4 w-4" />
            </button>
          </div>

          {/* Alineación */}
          <Section title="Alinear y distribuir">
            <div className="grid grid-cols-4 gap-1.5">
              {ALIGN_BUTTONS.map((a) => (
                <IconToggle key={a.id} title={a.title} onClick={() => align(a.id as never)}>
                  <Icon name={a.icon} className="h-4 w-4" />
                </IconToggle>
              ))}
            </div>
            {multi && (
              <Row>
                <button onClick={group} className="flex-1 rounded-md border px-2 py-1.5 text-xs hover:bg-accent">
                  Agrupar
                </button>
                <button onClick={ungroup} className="flex-1 rounded-md border px-2 py-1.5 text-xs hover:bg-accent">
                  Desagrupar
                </button>
              </Row>
            )}
          </Section>

          {/* Posición y tamaño (elemento único) */}
          {el && (
            <Section title="Posición y tamaño">
              <Row>
                <NumberField label="X" value={el.x} onChange={(v) => updateEl(el.id, { x: v })} />
                <NumberField label="Y" value={el.y} onChange={(v) => updateEl(el.id, { y: v })} />
              </Row>
              <Row>
                <NumberField label="An" value={el.width} onChange={(v) => updateEl(el.id, { width: Math.max(8, v) })} />
                <NumberField label="Al" value={el.height} onChange={(v) => updateEl(el.id, { height: Math.max(8, v) })} />
              </Row>
              <Row>
                <NumberField label="Rot" value={el.rotation} onChange={(v) => updateEl(el.id, { rotation: v })} min={-180} max={180} />
              </Row>
            </Section>
          )}

          {/* Tipografía */}
          {el?.kind === 'text' && <TextProps el={el} update={(p) => updateEl(el.id, p)} />}

          {/* Relleno / trazo / sombra para figuras */}
          {(el?.kind === 'rect' || el?.kind === 'ellipse') && (
            <ShapeProps el={el} update={(p) => updateEl(el.id, p)} />
          )}

          {el?.kind === 'line' && <LineProps el={el} update={(p) => updateEl(el.id, p)} />}
          {el?.kind === 'image' && (
            <Section title="Imagen">
              <NumberField label="Redondeo" value={el.cornerRadius} onChange={(v) => updateEl(el.id, { cornerRadius: v })} />
            </Section>
          )}
          {el?.kind === 'table' && <TableProps el={el} update={(p) => updateEl(el.id, p)} />}
          {el?.kind === 'chart' && <ChartProps el={el} update={(p) => updateEl(el.id, p)} />}

          {/* Opacidad (todos) */}
          <Section title="Opacidad">
            <div className="flex items-center gap-2">
              <Slider value={selected[0].opacity} onChange={(v) => update({ opacity: v })} />
              <span className="w-10 text-right text-xs text-muted-foreground">
                {Math.round(selected[0].opacity * 100)}%
              </span>
            </div>
          </Section>

          {/* Capas */}
          <Section title="Capas">
            <div className="grid grid-cols-4 gap-1.5">
              <IconToggle title="Traer al frente" onClick={() => el && reorder(el.id, 'front')}>
                <Icon name="ChevronsUp" className="h-4 w-4" />
              </IconToggle>
              <IconToggle title="Subir" onClick={() => el && reorder(el.id, 'forward')}>
                <Icon name="ChevronUp" className="h-4 w-4" />
              </IconToggle>
              <IconToggle title="Bajar" onClick={() => el && reorder(el.id, 'backward')}>
                <Icon name="ChevronDown" className="h-4 w-4" />
              </IconToggle>
              <IconToggle title="Enviar al fondo" onClick={() => el && reorder(el.id, 'back')}>
                <Icon name="ChevronsDown" className="h-4 w-4" />
              </IconToggle>
            </div>
            <Row>
              <button onClick={duplicate} className="flex-1 rounded-md border px-2 py-1.5 text-xs hover:bg-accent">
                Duplicar
              </button>
              <button onClick={remove} className="flex-1 rounded-md border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10">
                Eliminar
              </button>
            </Row>
          </Section>
        </>
      )}
    </div>
  )
}

function TextProps({ el, update }: { el: TextElement; update: (p: Partial<TextElement>) => void }) {
  const toggle = (flag: 'bold' | 'italic') => {
    const has = el.fontStyle.includes(flag)
    const parts = el.fontStyle.split(' ').filter(Boolean).filter((p) => p !== flag)
    if (!has) parts.push(flag)
    update({ fontStyle: (parts.join(' ') as TextElement['fontStyle']) || '' })
  }
  return (
    <Section title="Texto">
      <select
        value={el.fontFamily}
        onChange={(e) => update({ fontFamily: e.target.value })}
        className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
      >
        {FONTS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <Row>
        <NumberField label="Tam" value={el.fontSize} onChange={(v) => update({ fontSize: Math.max(6, v) })} />
        <NumberField label="Interlin" value={el.lineHeight} onChange={(v) => update({ lineHeight: v })} step={0.1} />
      </Row>
      <Row>
        <IconToggle active={el.fontStyle.includes('bold')} onClick={() => toggle('bold')} title="Negrita">
          <Bold className="h-4 w-4" />
        </IconToggle>
        <IconToggle active={el.fontStyle.includes('italic')} onClick={() => toggle('italic')} title="Cursiva">
          <Italic className="h-4 w-4" />
        </IconToggle>
        <IconToggle
          active={el.textDecoration === 'underline'}
          onClick={() => update({ textDecoration: el.textDecoration === 'underline' ? '' : 'underline' })}
          title="Subrayado"
        >
          <Underline className="h-4 w-4" />
        </IconToggle>
        <div className="mx-1 w-px self-stretch bg-border" />
        <IconToggle active={el.align === 'left'} onClick={() => update({ align: 'left' })} title="Izquierda">
          <AlignLeft className="h-4 w-4" />
        </IconToggle>
        <IconToggle active={el.align === 'center'} onClick={() => update({ align: 'center' })} title="Centrar">
          <AlignCenter className="h-4 w-4" />
        </IconToggle>
        <IconToggle active={el.align === 'right'} onClick={() => update({ align: 'right' })} title="Derecha">
          <AlignRight className="h-4 w-4" />
        </IconToggle>
      </Row>
      <ColorField value={el.fill} onChange={(v) => update({ fill: v })} label="Color" />
    </Section>
  )
}

function ShapeProps({
  el,
  update,
}: {
  el: EditorElement & { kind: 'rect' | 'ellipse' }
  update: (p: Record<string, unknown>) => void
}) {
  return (
    <Section title="Relleno y trazo">
      <ColorField value={el.fill} onChange={(v) => update({ fill: v })} label="Relleno" />
      <Row>
        <ColorField value={el.stroke} onChange={(v) => update({ stroke: v })} label="Trazo" />
        <NumberField label="Grosor" value={el.strokeWidth} onChange={(v) => update({ strokeWidth: Math.max(0, v) })} />
      </Row>
      {el.kind === 'rect' && (
        <NumberField label="Redondeo" value={el.cornerRadius} onChange={(v) => update({ cornerRadius: Math.max(0, v) })} />
      )}
      <label className="flex items-center gap-2 pt-1 text-xs">
        <input
          type="checkbox"
          checked={el.shadow.enabled}
          onChange={(e) => update({ shadow: { ...el.shadow, enabled: e.target.checked } })}
        />
        Sombra
      </label>
      {el.shadow.enabled && (
        <Row>
          <ColorField value={el.shadow.color} onChange={(v) => update({ shadow: { ...el.shadow, color: v } })} />
          <NumberField label="Difum" value={el.shadow.blur} onChange={(v) => update({ shadow: { ...el.shadow, blur: v } })} />
        </Row>
      )}
    </Section>
  )
}

function LineProps({
  el,
  update,
}: {
  el: EditorElement & { kind: 'line' }
  update: (p: Record<string, unknown>) => void
}) {
  return (
    <Section title="Línea">
      <Row>
        <ColorField value={el.stroke} onChange={(v) => update({ stroke: v })} label="Color" />
        <NumberField label="Grosor" value={el.strokeWidth} onChange={(v) => update({ strokeWidth: Math.max(1, v) })} />
      </Row>
      <Row>
        <label className="flex flex-1 items-center gap-2 text-xs">
          <input type="checkbox" checked={el.arrowStart} onChange={(e) => update({ arrowStart: e.target.checked })} />
          Punta inicio
        </label>
        <label className="flex flex-1 items-center gap-2 text-xs">
          <input type="checkbox" checked={el.arrowEnd} onChange={(e) => update({ arrowEnd: e.target.checked })} />
          Punta fin
        </label>
      </Row>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={el.dashed} onChange={(e) => update({ dashed: e.target.checked })} />
        Discontinua
      </label>
    </Section>
  )
}

function TableProps({ el, update }: { el: TableElement; update: (p: Partial<TableElement>) => void }) {
  const setCell = (r: number, c: number, v: string) => {
    const cells = el.cells.map((row) => [...row])
    cells[r][c] = v
    update({ cells })
  }
  const resize = (rows: number, cols: number) => {
    const cells = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => el.cells[r]?.[c] ?? (r === 0 ? `Columna ${c + 1}` : '')),
    )
    update({ rows, cols, cells })
  }
  return (
    <Section title="Tabla">
      <Row>
        <NumberField label="Filas" value={el.rows} onChange={(v) => resize(Math.max(1, v), el.cols)} min={1} />
        <NumberField label="Cols" value={el.cols} onChange={(v) => resize(el.rows, Math.max(1, v))} min={1} />
      </Row>
      <Row>
        <ColorField value={el.headerFill} onChange={(v) => update({ headerFill: v })} label="Encabezado" />
        <ColorField value={el.borderColor} onChange={(v) => update({ borderColor: v })} label="Borde" />
      </Row>
      <div className="max-h-40 space-y-1 overflow-y-auto scrollbar-thin">
        {el.cells.map((row, r) =>
          row.map((cell, c) => (
            <TextInput key={`${r}-${c}`} value={cell} onChange={(v) => setCell(r, c, v)} placeholder={`F${r + 1} C${c + 1}`} />
          )),
        )}
      </div>
    </Section>
  )
}

function ChartProps({ el, update }: { el: ChartElement; update: (p: Partial<ChartElement>) => void }) {
  const setDatum = (i: number, patch: Partial<{ label: string; value: number }>) => {
    const data = el.data.map((d, idx) => (idx === i ? { ...d, ...patch } : d))
    update({ data })
  }
  return (
    <Section title="Gráfico">
      <select
        value={el.chartType}
        onChange={(e) => update({ chartType: e.target.value as ChartElement['chartType'] })}
        className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
      >
        <option value="bar">Barras</option>
        <option value="line">Líneas</option>
        <option value="pie">Pastel</option>
      </select>
      <TextInput value={el.title} onChange={(v) => update({ title: v })} placeholder="Título del gráfico" />
      <div className="space-y-1">
        {el.data.map((d, i) => (
          <div key={i} className="flex gap-1.5">
            <TextInput value={d.label} onChange={(v) => setDatum(i, { label: v })} />
            <NumberField value={d.value} onChange={(v) => setDatum(i, { value: v })} />
            <button
              onClick={() => update({ data: el.data.filter((_, idx) => idx !== i) })}
              className="rounded-md border px-2 text-xs text-destructive hover:bg-destructive/10"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => update({ data: [...el.data, { label: 'Nuevo', value: 50 }] })}
        className="w-full rounded-md border px-2 py-1.5 text-xs hover:bg-accent"
      >
        + Añadir dato
      </button>
    </Section>
  )
}
