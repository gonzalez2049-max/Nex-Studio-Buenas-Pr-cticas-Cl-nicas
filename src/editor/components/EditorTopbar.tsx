import { useState } from 'react'
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  Eye,
  Share2,
  ClipboardCheck,
  Download,
  Check,
  Loader2,
} from 'lucide-react'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useEditor } from '@/editor/store'
import { getFormatDef } from '@/editor/formats'
import {
  exportAllToPng,
  exportPageToPng,
  exportPageToSvg,
  exportToPdf,
  exportToPptx,
} from '@/editor/export'
import { relativeDate } from '@/lib/format'

interface Props {
  title: string
  saving: boolean
  dirty: boolean
  lastSavedAt: string | null
  autosave: boolean
  onToggleAutosave: () => void
  onSave: () => void
  onBack: () => void
  onPreview: () => void
  onShare: () => void
  onReview: () => void
}

export function EditorTopbar(props: Props) {
  const { toast } = useToast()
  const doc = useEditor((s) => s.doc)
  const currentPage = useEditor((s) => s.currentPage())
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const [exporting, setExporting] = useState(false)

  const def = getFormatDef(doc.format)

  const run = async (label: string, fn: () => Promise<void>) => {
    setExporting(true)
    try {
      await fn()
      toast({ variant: 'success', title: `Exportado a ${label}` })
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error al exportar',
        description: e instanceof Error ? e.message : 'Error desconocido',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur surface">
      <Button variant="ghost" size="icon" onClick={props.onBack} title="Volver">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div
        className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white sm:flex"
        style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}
      >
        <span className="text-sm font-bold leading-none">N</span>
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{props.title}</span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {props.saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Guardando…
            </>
          ) : props.dirty ? (
            'Cambios sin guardar'
          ) : props.lastSavedAt ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" /> Guardado{' '}
              {relativeDate(props.lastSavedAt)}
            </>
          ) : (
            'Sin cambios'
          )}
        </span>
      </div>

      <div className="mx-2 h-6 w-px bg-border" />

      <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Deshacer">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Rehacer">
        <Redo2 className="h-4 w-4" />
      </Button>

      <button
        onClick={props.onToggleAutosave}
        className="ml-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        title="Autoguardado"
      >
        <span
          className={
            props.autosave
              ? 'h-2 w-2 rounded-full bg-emerald-500'
              : 'h-2 w-2 rounded-full bg-muted-foreground/40'
          }
        />
        Autoguardado
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Acciones secundarias agrupadas */}
        <div className="hidden items-center rounded-lg bg-muted/70 p-0.5 md:flex">
          <Button variant="ghost" size="sm" className="h-8" onClick={props.onPreview}>
            <Eye className="h-4 w-4" />
            Vista previa
          </Button>
          <Button variant="ghost" size="sm" className="h-8" onClick={props.onReview}>
            <ClipboardCheck className="h-4 w-4" />
            Revisar
          </Button>
          <Button variant="ghost" size="sm" className="h-8" onClick={props.onShare}>
            <Share2 className="h-4 w-4" />
            Compartir
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>{def.pageKind} actual</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => run('PNG', () => exportPageToPng(doc, currentPage, props.title))}>
              <Icon name="Image" className="h-4 w-4" />
              PNG (alta resolución)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => run('PDF', () => exportToPdf(doc, props.title, [currentPage]))}>
              <Icon name="FileText" className="h-4 w-4" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => run('SVG', async () => exportPageToSvg(doc, currentPage, props.title))}>
              <Icon name="Shapes" className="h-4 w-4" />
              SVG (vectorial)
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              {doc.format === 'kit_champion' ? 'Kit completo' : 'Documento completo'}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => run('PDF', () => exportToPdf(doc, props.title))}>
              <Icon name="FileText" className="h-4 w-4" />
              {doc.format === 'triptico' ? 'PDF listo para impresión' : 'PDF (todas las páginas)'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => run('PNG', () => exportAllToPng(doc, props.title))}>
              <Icon name="Images" className="h-4 w-4" />
              PNG por {def.pageKind.toLowerCase()}
            </DropdownMenuItem>
            {def.export.pptx && (
              <DropdownMenuItem onClick={() => run('PPTX', () => exportToPptx(doc, props.title))}>
                <Icon name="MonitorPlay" className="h-4 w-4" />
                PowerPoint editable (PPTX)
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" onClick={props.onSave} disabled={props.saving}>
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </header>
  )
}
