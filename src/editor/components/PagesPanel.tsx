import { Icon } from '@/components/common/Icon'
import { cn } from '@/lib/utils'
import { useEditor } from '@/editor/store'
import { getFormatDef } from '@/editor/formats'
import { pageHeight, pageWidth } from '@/editor/model'

export function PagesPanel() {
  const doc = useEditor((s) => s.doc)
  const currentId = useEditor((s) => s.currentPageId)
  const setCurrentPage = useEditor((s) => s.setCurrentPage)
  const addPage = useEditor((s) => s.addPage)
  const duplicatePage = useEditor((s) => s.duplicatePage)
  const removePage = useEditor((s) => s.removePage)
  const movePage = useEditor((s) => s.movePage)

  const def = getFormatDef(doc.format)

  return (
    <div className="flex w-40 shrink-0 flex-col border-r bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {def.pageKindPlural}
        </span>
        <button
          onClick={() => addPage()}
          className="rounded-md p-1 text-primary hover:bg-accent"
          title={`Añadir ${def.pageKind.toLowerCase()}`}
        >
          <Icon name="Plus" className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin">
        {doc.pages.map((page, i) => {
          const w = pageWidth(doc, page)
          const h = pageHeight(doc, page)
          const active = page.id === currentId
          return (
            <div
              key={page.id}
              className={cn(
                'group cursor-pointer rounded-md border bg-background p-1.5 transition-colors',
                active ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50',
              )}
              onClick={() => setCurrentPage(page.id)}
            >
              <div
                className="mb-1 flex items-center justify-center overflow-hidden rounded"
                style={{
                  aspectRatio: `${w} / ${h}`,
                  background: page.background || '#fff',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)',
                }}
              >
                <span className="text-lg font-semibold text-muted-foreground/40">
                  {i + 1}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[11px] font-medium">
                  {page.name}
                </span>
                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); movePage(page.id, 'up') }} className="rounded p-0.5 hover:bg-accent" title="Subir">
                    <Icon name="ChevronUp" className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); movePage(page.id, 'down') }} className="rounded p-0.5 hover:bg-accent" title="Bajar">
                    <Icon name="ChevronDown" className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); duplicatePage(page.id) }} className="rounded p-0.5 hover:bg-accent" title="Duplicar">
                    <Icon name="Copy" className="h-3 w-3" />
                  </button>
                  {doc.pages.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); removePage(page.id) }} className="rounded p-0.5 text-destructive hover:bg-destructive/10" title="Eliminar">
                      <Icon name="Trash2" className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              {page.kind && (
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {page.kind}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
