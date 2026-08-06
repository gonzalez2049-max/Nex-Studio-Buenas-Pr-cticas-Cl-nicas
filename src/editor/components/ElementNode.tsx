import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { Arrow, Ellipse, Group, Image as KonvaImage, Line, Rect, Text } from 'react-konva'
import type { EditorElement } from '@/editor/model'
import { useImage } from '@/editor/components/useImage'
import { KonvaTable } from '@/editor/components/KonvaTable'
import { KonvaChart } from '@/editor/components/KonvaChart'

interface Props {
  el: EditorElement
  onSelect: (id: string, additive: boolean) => void
  onChange: (id: string, patch: Partial<EditorElement>, history: boolean) => void
  onDragStart: () => void
  onEditText: (id: string) => void
}

function ImageInner({ el }: { el: Extract<EditorElement, { kind: 'image' }> }) {
  const img = useImage(el.src)
  return (
    <KonvaImage
      image={img}
      x={0}
      y={0}
      width={el.width}
      height={el.height}
      cornerRadius={el.cornerRadius}
    />
  )
}

export function ElementNode({
  el,
  onSelect,
  onChange,
  onDragStart,
  onEditText,
}: Props) {
  const handleSelect = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const additive =
      (e.evt as MouseEvent).shiftKey || (e.evt as MouseEvent).ctrlKey
    onSelect(el.id, Boolean(additive))
  }

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    onChange(el.id, { x: e.target.x(), y: e.target.y() }, false)
  }

  const handleTransformEnd = (e: KonvaEventObject<Event>) => {
    const node = e.target as Konva.Group
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const patch: Partial<EditorElement> = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(8, el.width * scaleX),
      height: Math.max(8, el.height * scaleY),
    }
    if (el.kind === 'line') {
      ;(patch as { points: number[] }).points = el.points.map((p, i) =>
        i % 2 === 0 ? p * scaleX : p * scaleY,
      )
    }
    onChange(el.id, patch, false)
  }

  const groupProps = {
    id: el.id,
    name: 'element',
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
    draggable: !el.locked,
    onMouseDown: handleSelect,
    onTap: handleSelect,
    onDragStart,
    onDragEnd: handleDragEnd,
    onTransformStart: onDragStart,
    onTransformEnd: handleTransformEnd,
  }

  return (
    <Group {...groupProps}>
      {el.kind === 'text' && (
        <Text
          x={0}
          y={0}
          width={el.width}
          text={el.text}
          fontSize={el.fontSize}
          fontFamily={`${el.fontFamily}, Arial, sans-serif`}
          fontStyle={el.fontStyle || 'normal'}
          textDecoration={el.textDecoration}
          align={el.align}
          fill={el.fill}
          lineHeight={el.lineHeight}
          onDblClick={() => onEditText(el.id)}
          onDblTap={() => onEditText(el.id)}
          perfectDrawEnabled={false}
        />
      )}

      {el.kind === 'rect' && (
        <Rect
          x={0}
          y={0}
          width={el.width}
          height={el.height}
          fill={el.fill}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
          cornerRadius={el.cornerRadius}
          shadowEnabled={el.shadow.enabled}
          shadowColor={el.shadow.color}
          shadowBlur={el.shadow.blur}
          shadowOffsetX={el.shadow.offsetX}
          shadowOffsetY={el.shadow.offsetY}
          shadowOpacity={0.35}
        />
      )}

      {el.kind === 'ellipse' && (
        <Ellipse
          x={el.width / 2}
          y={el.height / 2}
          radiusX={el.width / 2}
          radiusY={el.height / 2}
          fill={el.fill}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
          shadowEnabled={el.shadow.enabled}
          shadowColor={el.shadow.color}
          shadowBlur={el.shadow.blur}
          shadowOffsetX={el.shadow.offsetX}
          shadowOffsetY={el.shadow.offsetY}
          shadowOpacity={0.35}
        />
      )}

      {el.kind === 'line' &&
        (el.arrowStart || el.arrowEnd ? (
          <Arrow
            points={el.points}
            stroke={el.stroke}
            fill={el.stroke}
            strokeWidth={el.strokeWidth}
            pointerAtBeginning={el.arrowStart}
            pointerAtEnding={el.arrowEnd}
            dash={el.dashed ? [12, 8] : undefined}
            lineCap="round"
            lineJoin="round"
          />
        ) : (
          <Line
            points={el.points}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth}
            dash={el.dashed ? [12, 8] : undefined}
            lineCap="round"
            lineJoin="round"
          />
        ))}

      {el.kind === 'image' && <ImageInner el={el} />}
      {el.kind === 'table' && <KonvaTable el={el} />}
      {el.kind === 'chart' && <KonvaChart el={el} />}
    </Group>
  )
}
