import { icons, type LucideProps } from 'lucide-react'

interface IconProps extends LucideProps {
  name: string
}

/**
 * Renderiza un icono de lucide-react por nombre. Si el nombre no existe,
 * usa un punto/círculo neutro para no romper el layout.
 */
export function Icon({ name, ...props }: IconProps) {
  const Cmp = (icons as Record<string, React.ComponentType<LucideProps>>)[name]
  if (!Cmp) {
    const Fallback = icons.Circle
    return <Fallback {...props} />
  }
  return <Cmp {...props} />
}
