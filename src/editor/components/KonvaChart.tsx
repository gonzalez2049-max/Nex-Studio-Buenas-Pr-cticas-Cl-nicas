import { Arc, Circle, Group, Line, Rect, Text } from 'react-konva'
import type { ChartElement } from '@/editor/model'

/** Renderiza un gráfico (barras/línea/pastel) en el lienzo. */
export function KonvaChart({ el }: { el: ChartElement }) {
  const nodes = []
  nodes.push(
    <Rect key="bg" x={0} y={0} width={el.width} height={el.height} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1} cornerRadius={8} />,
  )
  const padT = el.title ? 40 : 16
  if (el.title)
    nodes.push(
      <Text key="title" x={16} y={12} width={el.width - 32} text={el.title} fontSize={16} fontStyle="bold" fill="#0f172a" fontFamily="Inter, Arial, sans-serif" />,
    )
  const padL = 16
  const padB = 28
  const cw = el.width - padL * 2
  const ch = el.height - padT - padB
  const max = Math.max(...el.data.map((d) => d.value), 1)

  if (el.chartType === 'pie') {
    const total = el.data.reduce((s, d) => s + d.value, 0) || 1
    const cx = el.width / 2
    const cy = padT + ch / 2
    const rad = Math.min(cw, ch) / 2 - 6
    let start = -90
    el.data.forEach((d, i) => {
      const angle = (d.value / total) * 360
      nodes.push(
        <Arc key={`sl-${i}`} x={cx} y={cy} innerRadius={0} outerRadius={rad} angle={angle} rotation={start} fill={el.palette[i % el.palette.length]} />,
      )
      start += angle
    })
  } else if (el.chartType === 'line') {
    const step = cw / Math.max(el.data.length - 1, 1)
    const pts: number[] = []
    el.data.forEach((d, i) => pts.push(padL + i * step, padT + ch - (d.value / max) * ch))
    nodes.push(<Line key="ln" points={pts} stroke={el.palette[0]} strokeWidth={3} lineJoin="round" />)
    el.data.forEach((d, i) =>
      nodes.push(<Circle key={`pt-${i}`} x={padL + i * step} y={padT + ch - (d.value / max) * ch} radius={4} fill={el.palette[0]} />),
    )
  } else {
    const gap = 10
    const bw = (cw - gap * (el.data.length - 1)) / el.data.length
    el.data.forEach((d, i) => {
      const bh = (d.value / max) * ch
      nodes.push(
        <Rect key={`bar-${i}`} x={padL + i * (bw + gap)} y={padT + ch - bh} width={bw} height={bh} fill={el.palette[i % el.palette.length]} cornerRadius={4} />,
      )
    })
  }
  el.data.forEach((d, i) => {
    const step = cw / el.data.length
    nodes.push(
      <Text key={`lb-${i}`} x={padL + i * step} y={el.height - padB + 6} width={step} text={d.label} fontSize={11} fill="#64748b" align="center" fontFamily="Inter, Arial, sans-serif" />,
    )
  })

  return <Group>{nodes}</Group>
}
