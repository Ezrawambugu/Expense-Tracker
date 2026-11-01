import type { ReactNode } from 'react'

// Empty states are calm, not alarming: a soft glyph, one sentence, one action.
// Used inside cards and inside table bodies (TableEmpty) so both read the same.
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="bg-surface-elevated text-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full"
        >
          {icon}
        </span>
      )}
      <p className="text-subheadline text-foreground font-medium">{title}</p>
      {description && (
        <p className="text-footnote text-muted mt-1 max-w-sm text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
