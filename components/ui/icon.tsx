import type { LucideIcon } from 'lucide-react'

// One place for lucide icon sizing: 1.75 stroke everywhere, 16px by default.
// Icons are decorative unless the surrounding control has its own label.
export function Icon({
  icon: Glyph,
  size = 16,
  className,
}: {
  icon: LucideIcon
  size?: number
  className?: string
}) {
  return (
    <Glyph
      aria-hidden="true"
      size={size}
      strokeWidth={1.75}
      className={className}
    />
  )
}
