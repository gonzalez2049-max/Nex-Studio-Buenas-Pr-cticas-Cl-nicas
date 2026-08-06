/**
 * Fondo decorativo clínico (ilustración vectorial, sin imágenes externas).
 * Combina un trazo de pulso (ECG) con formas suaves; se tiñe con el color del
 * módulo. Puramente estético.
 */
export function ClinicalBackdrop({
  className,
  tone = '#ffffff',
  opacity = 0.9,
}: {
  className?: string
  tone?: string
  opacity?: number
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 240"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g opacity={opacity} stroke={tone} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M-10 150 H120 l18 -70 22 120 20 -60 h40 l16 -34 18 60 22 -16 H600"
          opacity="0.55"
        />
      </g>
      <g fill={tone} opacity={opacity}>
        <circle cx="470" cy="60" r="70" opacity="0.10" />
        <circle cx="540" cy="150" r="110" opacity="0.08" />
        <circle cx="120" cy="30" r="60" opacity="0.07" />
      </g>
      <g stroke={tone} strokeWidth="2" opacity={opacity * 0.5}>
        <path d="M430 40 v40 M410 60 h40" strokeLinecap="round" />
      </g>
    </svg>
  )
}
