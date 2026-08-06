import * as React from 'react'
import { Icon } from '@/components/common/Icon'
import { ClinicalBackdrop } from '@/components/common/ClinicalBackdrop'
import { moduleGradient, type ModuleTheme } from '@/lib/modules'

/**
 * Encabezado de sección con degradado del módulo, tipografía grande y una
 * ilustración clínica de fondo. Da profundidad y jerarquía a cada área.
 */
export function ModuleHero({
  module,
  eyebrow,
  title,
  subtitle,
  actions,
  compact = false,
}: {
  module: ModuleTheme
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  compact?: boolean
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl text-white surface-lg"
      style={{ background: moduleGradient(module) }}
    >
      <ClinicalBackdrop
        className="pointer-events-none absolute inset-0 h-full w-full"
        tone="#ffffff"
        opacity={0.9}
      />
      <div
        className={`relative flex flex-col gap-5 ${compact ? 'p-6 sm:p-7' : 'p-7 sm:p-9'} sm:flex-row sm:items-end sm:justify-between`}
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Icon name={module.icon} className="h-5 w-5" />
            </span>
            {eyebrow && (
              <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                {eyebrow}
              </span>
            )}
          </div>
          <h1 className={`font-semibold tracking-tight ${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-xl text-sm text-white/85 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </section>
  )
}
