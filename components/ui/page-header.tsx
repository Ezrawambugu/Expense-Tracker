import type { ReactNode } from 'react'

// iOS large-title header: one dominant line, a quiet secondary line, and
// actions aligned to the baseline on the right. Stacks on phones so the title
// never competes with a button for width.
export function PageHeader({
  title,
  description,
  secondary,
  actions,
  className = '',
}: {
  title: ReactNode
  description?: ReactNode
  secondary?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        {secondary && (
          <p className="text-footnote text-muted mb-1.5 font-medium tracking-wide uppercase">
            {secondary}
          </p>
        )}
        <h1 className="text-large-title text-foreground">{title}</h1>
        {description && (
          <p className="text-subheadline text-muted mt-1.5 max-w-2xl text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

// Section heading inside a page: 17px semibold plus one muted line, with the
// optional trailing action. Keeps every section rhythm identical.
export function SectionHeader({
  title,
  description,
  action,
  className = '',
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-3 ${className}`}
    >
      <div>
        <h2 className="text-headline text-foreground">{title}</h2>
        {description && (
          <p className="text-subheadline text-muted mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
