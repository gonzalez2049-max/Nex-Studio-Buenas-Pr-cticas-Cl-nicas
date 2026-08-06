import { useEffect, useRef, useState } from 'react'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { Layer, Line, Rect, Stage, Transformer } from 'react-konva'
import { useEditor } from '@/editor/store'
import { pageHeight, pageWidth, type TextElement } from '@/editor/model'
import { ElementNode } from '@/editor/components/ElementNode'

const SNAP = 6

export function CanvasStage() {
  const doc = useEditor((s) => s.doc)
  const zoom = useEditor((s) => s.zoom)
  const selectedIds = useEditor((s) => s.selectedIds)
  const currentPage = useEditor((s) => s.currentPage())
  const select = useEditor((s) => s.select)
  const toggleSelection = useEditor((s) => s.toggleSelection)
  const clearSelection = useEditor((s) => s.clearSelection)
  const updateElement = useEditor((s) => s.updateElement)
  const pushHistory = useEditor((s) => s.pushHistory)

  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] })
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const marqueeStart = useRef<{ x: number; y: number } | null>(null)

  const W = pageWidth(doc, currentPage)
  const H = pageHeight(doc, currentPage)

  // Ajusta el transformador a la selección actual.
  useEffect(() => {
    const stage = stageRef.current
    const tr = trRef.current
    if (!stage || !tr) return
    const nodes = selectedIds
      .map((id) => stage.findOne('#' + id))
      .filter((n): n is Konva.Node => Boolean(n) && !(n as Konva.Node).getAttr('locked'))
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selectedIds, doc, editing])

  const onSelectElement = (id: string, additive: boolean) => {
    if (additive) toggleSelection(id)
    else if (!selectedIds.includes(id)) select([id])
  }

  const onStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === 'bg') {
      clearSelection()
      const pos = relativePointer()
      if (pos) {
        marqueeStart.current = pos
        setMarquee({ x: pos.x, y: pos.y, w: 0, h: 0 })
      }
    }
  }

  const relativePointer = () => {
    const stage = stageRef.current
    if (!stage) return null
    const p = stage.getPointerPosition()
    if (!p) return null
    return { x: p.x / zoom, y: p.y / zoom }
  }

  const onStageMouseMove = () => {
    if (!marqueeStart.current) return
    const pos = relativePointer()
    if (!pos) return
    const s = marqueeStart.current
    setMarquee({
      x: Math.min(s.x, pos.x),
      y: Math.min(s.y, pos.y),
      w: Math.abs(pos.x - s.x),
      h: Math.abs(pos.y - s.y),
    })
  }

  const onStageMouseUp = () => {
    if (marquee && marqueeStart.current && (marquee.w > 4 || marquee.h > 4)) {
      const hits = currentPage.elements
        .filter(
          (el) =>
            el.x + el.width >= marquee.x &&
            el.x <= marquee.x + marquee.w &&
            el.y + el.height >= marquee.y &&
            el.y <= marquee.y + marquee.h,
        )
        .map((el) => el.id)
      if (hits.length) select(hits)
    }
    marqueeStart.current = null
    setMarquee(null)
  }

  // Snapping durante el arrastre: bordes/centros de la página.
  const onDragMove = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target
    if (node.name() !== 'element') return
    const box = node.getClientRect({ relativeTo: node.getLayer()! })
    const targetsV = [doc.margin, W / 2, W - doc.margin, 0, W]
    const targetsH = [doc.margin, H / 2, H - doc.margin, 0, H]
    const edgesV = [box.x, box.x + box.width / 2, box.x + box.width]
    const edgesH = [box.y, box.y + box.height / 2, box.y + box.height]
    const gv: number[] = []
    const gh: number[] = []
    let dx = 0
    let dy = 0
    edgesV.forEach((edge, i) => {
      for (const t of targetsV)
        if (Math.abs(edge - t) < SNAP) {
          dx = t - edge + (i === 1 ? 0 : 0)
          gv.push(t)
        }
    })
    edgesH.forEach((edge) => {
      for (const t of targetsH)
        if (Math.abs(edge - t) < SNAP) {
          dy = t - edge
          gh.push(t)
        }
    })
    if (dx) node.x(node.x() + dx)
    if (dy) node.y(node.y() + dy)
    setGuides({ v: gv, h: gh })
  }

  const onDragEnd = () => setGuides({ v: [], h: [] })

  const editingEl =
    editing && currentPage.elements.find((e) => e.id === editing && e.kind === 'text')
      ? (currentPage.elements.find((e) => e.id === editing) as TextElement)
      : null

  return (
    <div className="relative" style={{ width: W * zoom, height: H * zoom }}>
      <Stage
        ref={stageRef}
        width={W * zoom}
        height={H * zoom}
        scaleX={zoom}
        scaleY={zoom}
        onMouseDown={onStageMouseDown}
        onMouseMove={onStageMouseMove}
        onMouseUp={onStageMouseUp}
        onTouchStart={onStageMouseDown as never}
        style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.12), 0 8px 30px rgba(0,0,0,.08)' }}
      >
        <Layer onDragMove={onDragMove} onDragEnd={onDragEnd}>
          <Rect name="bg" x={0} y={0} width={W} height={H} fill={currentPage.background || '#ffffff'} />

          {/* Guías de pliegue (trípticos/dípticos) */}
          {currentPage.folds?.map((f, i) => (
            <Line key={`fold-${i}`} points={[W * f, 0, W * f, H]} stroke="#94a3b8" strokeWidth={1} dash={[8, 8]} listening={false} />
          ))}

          {currentPage.elements.map((el) => (
            <ElementNode
              key={el.id}
              el={el}
              onSelect={onSelectElement}
              onChange={(id, patch, history) => updateElement(id, patch, history)}
              onDragStart={pushHistory}
              onEditText={setEditing}
            />
          ))}

          {/* Guías de alineación */}
          {guides.v.map((x, i) => (
            <Line key={`gv-${i}`} points={[x, 0, x, H]} stroke="#0ea5e9" strokeWidth={1} listening={false} />
          ))}
          {guides.h.map((y, i) => (
            <Line key={`gh-${i}`} points={[0, y, W, y]} stroke="#0ea5e9" strokeWidth={1} listening={false} />
          ))}

          {marquee && (
            <Rect x={marquee.x} y={marquee.y} width={marquee.w} height={marquee.h} fill="rgba(13,148,136,.12)" stroke="#0d9488" strokeWidth={1} listening={false} />
          )}

          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio={false}
            anchorSize={9}
            anchorStroke="#0d9488"
            anchorCornerRadius={2}
            borderStroke="#0d9488"
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
            }
          />
        </Layer>
      </Stage>

      {/* Edición de texto en línea */}
      {editingEl && (
        <textarea
          autoFocus
          defaultValue={editingEl.text}
          onBlur={(e) => {
            pushHistory()
            updateElement(editingEl.id, { text: e.target.value }, false)
            setEditing(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur()
          }}
          style={{
            position: 'absolute',
            left: editingEl.x * zoom,
            top: editingEl.y * zoom,
            width: editingEl.width * zoom,
            minHeight: editingEl.height * zoom,
            fontSize: editingEl.fontSize * zoom,
            fontFamily: `${editingEl.fontFamily}, Arial, sans-serif`,
            fontWeight: editingEl.fontStyle.includes('bold') ? 700 : 400,
            fontStyle: editingEl.fontStyle.includes('italic') ? 'italic' : 'normal',
            textAlign: editingEl.align,
            lineHeight: editingEl.lineHeight,
            color: editingEl.fill,
            border: '2px solid #0d9488',
            outline: 'none',
            padding: 0,
            margin: 0,
            resize: 'none',
            background: 'rgba(255,255,255,.96)',
            overflow: 'hidden',
            zIndex: 20,
          }}
        />
      )}
    </div>
  )
}
