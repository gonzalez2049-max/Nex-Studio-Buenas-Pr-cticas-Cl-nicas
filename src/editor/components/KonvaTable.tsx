import { Group, Rect, Text } from 'react-konva'
import type { TableElement } from '@/editor/model'

/** Renderiza una tabla como grupo de celdas en el lienzo (editable). */
export function KonvaTable({ el }: { el: TableElement }) {
  const cw = el.width / el.cols
  const rh = el.height / el.rows
  const cells = []
  for (let r = 0; r < el.rows; r++) {
    for (let c = 0; c < el.cols; c++) {
      cells.push(
        <Rect
          key={`bg-${r}-${c}`}
          x={c * cw}
          y={r * rh}
          width={cw}
          height={rh}
          fill={r === 0 ? el.headerFill : '#ffffff'}
          stroke={el.borderColor}
          strokeWidth={1}
        />,
      )
      cells.push(
        <Text
          key={`tx-${r}-${c}`}
          x={c * cw + 8}
          y={r * rh + rh / 2 - el.fontSize / 2}
          width={cw - 16}
          text={el.cells[r]?.[c] ?? ''}
          fontSize={el.fontSize}
          fontFamily="Inter, Arial, sans-serif"
          fontStyle={r === 0 ? 'bold' : 'normal'}
          fill={r === 0 ? el.headerTextColor : el.textColor}
          wrap="none"
          ellipsis
        />,
      )
    }
  }
  return <Group>{cells}</Group>
}
