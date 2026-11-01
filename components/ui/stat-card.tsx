import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Progress, type ProgressTone } from '@/components/ui/progress'

// Dashboard / report stat tile: quiet label, one large tabular number, one
// footnote of context. Numbers are the loudest thing on the card, which is the
// whole point of a stat tile.
export function StatCard({
  label,
  value,
  hint,
  tone = 'accent',
  ratio,
  icon,
  className = '',
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: ProgressTone
  ratio?: number
  icon?: ReactNode
  className?: string
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-footnote text-muted font-medium">{label}</p>
        {icon && (
          <span className="bg-surface-elevated text-muted rounded-full p-1.5">
            {icon}
          </span>
        )}
      </div>
      <p className="text-title text-foreground mt-1 tabular-nums">{value}</p>
      {typeof ratio === 'number' && (
        <div className="mt-3">
          <Progress ratio={ratio} tone={tone} label={String(label)} />
        </div>
      )}
      {hint && <p className="text-footnote text-muted mt-2">{hint}</p>}
    </Card>
  )
}
