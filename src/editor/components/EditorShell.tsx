import { useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useEditor } from '@/editor/store'
import { getFormatDef } from '@/editor/formats'
import { LeftPanel } from '@/editor/components/LeftPanel'
import { RightPanel } from '@/editor/components/RightPanel'
import { PagesPanel } from '@/editor/components/PagesPanel'
import { CanvasStage } from '@/editor/components/CanvasStage'

export function EditorShell({ onSave }: { onSave: () => void }) {
  const doc = useEditor((s) => s.doc)
  const zoom = useEditor((s) => s.zoom)
  const setZoom = useEditor((s) => s.setZoom)
  const zoomIn = useEditor((s) => s.zoomIn)
  const zoomOut = useEditor((s) => s.zoomOut)

  const def = getFormatDef(doc.format)
  const showPages = def.paginated || doc.pages.length > 1

  // Atajos de teclado del editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      const s = useEditor.getState()

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSave()
        return
      }
      if (typing) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        s.redo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        s.duplicateSelected()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        s.selectAll()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (s.selectedIds.length) {
          e.preventDefault()
          s.removeSelected()
        }
      } else if (e.key === 'Escape') {
        s.clearSelection()
      } else if (e.key.startsWith('Arrow') && s.selectedIds.length) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        s.pushHistory()
        for (const el of s.selectedElements())
          s.updateElement(el.id, { x: el.x + dx, y: el.y + dy }, false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSave])

  return (
    <div className="flex min-h-0 flex-1">
      <LeftPanel />
      {showPages && <PagesPanel />}

      {/* Área del lienzo */}
      <div className="editor-stage-bg relative flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-auto scrollbar-thin">
          <div className="flex min-h-full items-start justify-center p-10">
            <CanvasStage />
          </div>
        </div>

        {/* Controles de zoom */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background px-2 py-1 shadow-md">
          <button onClick={zoomOut} className="rounded-full p-1.5 hover:bg-accent" title="Alejar">
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="min-w-14 text-center text-xs font-medium tabular-nums hover:text-primary"
            title="Restablecer zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={zoomIn} className="rounded-full p-1.5 hover:bg-accent" title="Acercar">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <RightPanel />
    </div>
  )
}
