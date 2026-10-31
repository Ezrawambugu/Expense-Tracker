import Link from 'next/link'

// Phase 8B segmented control for small tab-like filter choices. It renders
// links, so the URL remains the single source of truth and existing filter
// behaviour is untouched. Wrap it in a GET form only when the choice is a
// form field; for view switches, links are enough.
export type Segment = { value: string; label: string; href: string }

export function SegmentedControl({
  label,
  value,
  options,
  className = '',
}: {
  label: string
  value: string
  options: Segment[]
  className?: string
}) {
  return (
    <nav
      aria-label={label}
      className={`bg-surface-elevated border-separator inline-flex rounded-full border p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <Link
            key={option.value}
            href={option.href}
            aria-current={active ? 'page' : undefined}
            className={`text-footnote duration-hover ease-apple rounded-full px-3 py-1.5 font-medium transition-[background-color,color] ${
              active
                ? 'bg-accent-fill text-on-accent shadow-card'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {option.label}
          </Link>
        )
      })}
    </nav>
  )
}
