import { useRef, useState } from 'react'
import { Icon } from '@/components/common/Icon'
import { cn } from '@/lib/utils'
import { useEditor } from '@/editor/store'
import { getFormatDef } from '@/editor/formats'
import { pageHeight, pageWidth } from '@/editor/model'
import {
  makeChart,
  makeEllipse,
  makeHeading,
  makeIcon,
  makeImage,
  makeLine,
  makeLogo,
  makeQr,
  makeRect,
  makeTable,
  makeText,
} from '@/editor/factory'
import { CLINICAL_ICONS } from '@/editor/assets'

type Cat =
  | 'estructura'
  | 'texto'
  | 'figuras'
  | 'iconos'
  | 'imagenes'
  | 'tablas'
  | 'graficos'
  | 'fondos'
  | 'recursos'

const CATS: { id: Cat; label: string; icon: string }[] = [
  { id: 'estructura', label: 'Estructura', icon: 'LayoutTemplate' },
  { id: 'texto', label: 'Texto', icon: 'Type' },
  { id: 'figuras', label: 'Figuras', icon: 'Shapes' },
  { id: 'iconos', label: 'Iconos', icon: 'Sticker' },
  { id: 'imagenes', label: 'Imágenes', icon: 'Image' },
  { id: 'tablas', label: 'Tablas', icon: 'Table' },
  { id: 'graficos', label: 'Gráficos', icon: 'ChartColumn' },
  { id: 'fondos', label: 'Fondos', icon: 'PaintBucket' },
  { id: 'recursos', label: 'Recursos', icon: 'Stethoscope' },
]

const BG_COLORS = [
  '#ffffff', '#f8fafc', '#f0fdfa', '#ecfeff', '#0f172a', '#0f766e',
  '#1e293b', '#fef9c3', '#fee2e2', '#e0f2fe', '#faf5ff', '#111827',
]

function Item({
  icon,
  label,
  onClick,
}: {
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
    >
      <Icon name={icon} className="h-4 w-4 text-primary" />
      {label}
    </button>
  )
}

export function LeftPanel() {
  const [cat, setCat] = useState<Cat>('estructura')
  const doc = useEditor((s) => s.doc)
  const page = useEditor((s) => s.currentPage())
  const addElements = useEditor((s) => s.addElements)
  const setPageBackground = useEditor((s) => s.setPageBackground)
  const fileRef = useRef<HTMLInputElement>(null)

  const def = getFormatDef(doc.format)
  const ctx = { pageW: pageWidth(doc, page), pageH: pageHeight(doc, page) }

  const onUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string')
        addElements([makeImage(reader.result, { width: 320, height: 240 })])
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex h-full">
      {/* Rail de categorías */}
      <div className="flex w-16 shrink-0 flex-col items-center gap-1 border-r bg-muted/40 py-3">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={cn(
              'flex w-14 flex-col items-center gap-1 rounded-md py-2 text-[10px] font-medium transition-colors',
              cat === c.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            <Icon name={c.icon} className="h-4 w-4" />
            {c.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="w-56 shrink-0 space-y-2 overflow-y-auto p-3 scrollbar-thin">
        {cat === 'estructura' && (
          <>
            <p className="px-1 text-xs font-semibold text-muted-foreground">
              Bloques de {def.pageKind.toLowerCase()}
            </p>
            {def.blocks.map((b) => (
              <Item
                key={b.id}
                icon={b.icon}
                label={b.label}
                onClick={() => addElements(b.build(ctx))}
              />
            ))}
            {def.addablePages.length > 0 && (
              <p className="px-1 pt-2 text-xs text-muted-foreground">
                Usa el panel de {def.pageKindPlural.toLowerCase()} para añadir
                páginas.
              </p>
            )}
          </>
        )}

        {cat === 'texto' && (
          <>
            <Item icon="Heading1" label="Título" onClick={() => addElements([makeHeading('Título')])} />
            <Item icon="Heading2" label="Subtítulo" onClick={() => addElements([makeText({ text: 'Subtítulo', fontSize: 28, fontStyle: 'bold' })])} />
            <Item icon="Type" label="Párrafo" onClick={() => addElements([makeText({ text: 'Texto de párrafo…', fontSize: 18, height: 90 })])} />
            <Item icon="List" label="Lista" onClick={() => addElements([makeText({ text: '•  Punto uno\n•  Punto dos\n•  Punto tres', fontSize: 18, height: 110, lineHeight: 1.6 })])} />
          </>
        )}

        {cat === 'figuras' && (
          <>
            <Item icon="Square" label="Rectángulo" onClick={() => addElements([makeRect()])} />
            <Item icon="Circle" label="Elipse" onClick={() => addElements([makeEllipse()])} />
            <Item icon="Minus" label="Línea" onClick={() => addElements([makeLine({ arrowEnd: false })])} />
            <Item icon="MoveRight" label="Flecha" onClick={() => addElements([makeLine({ arrowEnd: true })])} />
            <Item icon="Square" label="Tarjeta" onClick={() => addElements([makeRect({ fill: '#ffffff', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 16, shadow: { enabled: true, color: '#0f172a', blur: 18, offsetX: 0, offsetY: 8 } })])} />
          </>
        )}

        {cat === 'iconos' && (
          <div className="grid grid-cols-4 gap-1.5">
            {CLINICAL_ICONS.map((ic) => (
              <button
                key={ic.id}
                title={ic.label}
                onClick={() => addElements([makeIcon(ic.id, '#0f172a')])}
                className="flex aspect-square items-center justify-center rounded-md border p-2 hover:border-primary hover:bg-accent"
              >
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic.body}</svg>`,
                  )}`}
                  alt={ic.label}
                  className="h-6 w-6"
                />
              </button>
            ))}
          </div>
        )}

        {cat === 'imagenes' && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            />
            <Item icon="Upload" label="Subir imagen" onClick={() => fileRef.current?.click()} />
            <Item icon="ImagePlus" label="Marcador de imagen" onClick={() => addElements([makeImage(placeholderImg())])} />
            <Item icon="BadgeCheck" label="Logo UBPC" onClick={() => addElements([makeLogo('UBPC')])} />
            <Item icon="QrCode" label="Código QR" onClick={() => addElements([makeQr()])} />
          </>
        )}

        {cat === 'tablas' && (
          <>
            <Item icon="Table" label="Tabla 3×4" onClick={() => addElements([makeTable({ rows: 4, cols: 3 })])} />
            <Item icon="Table2" label="Tabla 2×5" onClick={() => addElements([makeTable({ rows: 5, cols: 2 })])} />
            <Item icon="Grid3x3" label="Tabla 4×4" onClick={() => addElements([makeTable({ rows: 4, cols: 4 })])} />
          </>
        )}

        {cat === 'graficos' && (
          <>
            <Item icon="ChartColumn" label="Barras" onClick={() => addElements([makeChart({ chartType: 'bar' })])} />
            <Item icon="ChartLine" label="Líneas" onClick={() => addElements([makeChart({ chartType: 'line' })])} />
            <Item icon="ChartPie" label="Pastel" onClick={() => addElements([makeChart({ chartType: 'pie' })])} />
          </>
        )}

        {cat === 'fondos' && (
          <>
            <p className="px-1 text-xs font-semibold text-muted-foreground">
              Color de {def.pageKind.toLowerCase()}
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setPageBackground(c)}
                  className="aspect-square rounded-md border"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
            <label className="mt-2 flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              Personalizado
              <input
                type="color"
                value={page.background}
                onChange={(e) => setPageBackground(e.target.value)}
                className="h-6 w-10 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
          </>
        )}

        {cat === 'recursos' && (
          <>
            <p className="px-1 text-xs font-semibold text-muted-foreground">
              Recursos clínicos
            </p>
            <Item
              icon="ShieldCheck"
              label="Bloque de seguridad"
              onClick={() =>
                addElements([
                  makeRect({ fill: '#f0fdfa', cornerRadius: 16, width: 320, height: 120 }),
                  makeIcon('shield-check', '#0f766e'),
                  makeText({ text: 'Práctica segura', x: 220, y: 130, width: 220, fontSize: 20, fontStyle: 'bold', fill: '#0f766e' }),
                ])
              }
            />
            <Item
              icon="TriangleAlert"
              label="Advertencia"
              onClick={() =>
                addElements([
                  makeRect({ fill: '#fef2f2', cornerRadius: 16, width: 320, height: 120 }),
                  makeIcon('alert', '#dc2626'),
                  makeText({ text: 'Precaución importante', x: 220, y: 130, width: 220, fontSize: 20, fontStyle: 'bold', fill: '#dc2626' }),
                ])
              }
            />
            <Item icon="Stethoscope" label="Icono clínico" onClick={() => addElements([makeIcon('stethoscope', '#0f172a')])} />
            <Item icon="QrCode" label="QR de referencia" onClick={() => addElements([makeQr('https://ubpc.org')])} />
          </>
        )}
      </div>
    </div>
  )
}

function placeholderImg() {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect width="320" height="240" fill="#e2e8f0"/><path d="M120 150l40-48 30 34 24-20 26 34H100z" fill="#94a3b8"/><circle cx="120" cy="90" r="18" fill="#94a3b8"/></svg>',
  )}`
}
