import type { ReactNode } from 'react'

// Phase 8B card: solid surface with the soft layered shadow. Glass is reserved
// for floating chrome (bars, toasts, dialogs), never for content cards.
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-card bg-surface shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({
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
      className={`flex flex-wrap items-start justify-between gap-3 ${className}`}
    >
      <div>
        <h2 className="text-headline">{title}</h2>
        {description && (
          <p className="text-subheadline text-muted mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
