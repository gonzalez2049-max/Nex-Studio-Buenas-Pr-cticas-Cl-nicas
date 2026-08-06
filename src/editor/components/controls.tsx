import * as React from 'react'
import { cn } from '@/lib/utils'

export function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2 border-b px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}

export function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>
}

export function ColorField({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label?: string
}) {
  return (
    <label className="flex flex-1 items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs">
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className="flex items-center gap-1.5">
        <span
          className="h-5 w-5 rounded border"
          style={{ background: value }}
        />
        <input
          type="color"
          value={/^#([0-9a-f]{6})$/i.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
        />
      </span>
    </label>
  )
}

export function NumberField({
  value,
  onChange,
  label,
  min,
  max,
  step = 1,
}: {
  value: number
  onChange: (v: number) => void
  label?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <label className="flex flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs">
      {label && <span className="text-muted-foreground">{label}</span>}
      <input
        type="number"
        value={Math.round(value)}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent text-right outline-none"
      />
    </label>
  )
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer accent-primary"
    />
  )
}

export function IconToggle({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border px-2 py-1.5 text-xs outline-none focus:border-primary"
    />
  )
}
