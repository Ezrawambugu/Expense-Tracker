import type { ReactNode } from 'react'

// Phase 8B status badges: capsule, tinted background, matching AA-safe text,
// and a dot so status is never carried by colour alone. The text label is
// always present. Labels for budget status match the previous wording exactly.
export type BadgeTone = 'ok' | 'warning' | 'exceeded' | 'neutral' | 'info'

const TONES: Record<BadgeTone, string> = {
  ok: 'bg-ok-tint text-ok-text',
  warning: 'bg-warning-tint text-warning-text',
  exceeded: 'bg-exceeded-tint text-exceeded-text',
  neutral: 'bg-neutral-status-tint text-neutral-status-text',
  info: 'bg-accent-tint text-accent-text',
}

const DOTS: Record<BadgeTone, string> = {
  ok: 'bg-ok',
  warning: 'bg-warning',
  exceeded: 'bg-exceeded',
  neutral: 'bg-neutral-status',
  info: 'bg-accent',
}

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`text-footnote inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} />
      {children}
    </span>
  )
}

export type BudgetStatusValue = 'ok' | 'warning' | 'exceeded' | 'unbudgeted'

const BUDGET_LABEL: Record<BudgetStatusValue, string> = {
  ok: 'OK',
  warning: 'Warning',
  exceeded: 'Exceeded',
  unbudgeted: 'No budget',
}

const BUDGET_TONE: Record<BudgetStatusValue, BadgeTone> = {
  ok: 'ok',
  warning: 'warning',
  exceeded: 'exceeded',
  unbudgeted: 'neutral',
}

export function StatusBadge({ status }: { status: BudgetStatusValue }) {
  return <Badge tone={BUDGET_TONE[status]}>{BUDGET_LABEL[status]}</Badge>
}

export type ExpenseStatusValue = 'pending' | 'approved' | 'rejected'

const EXPENSE_TONE: Record<ExpenseStatusValue, BadgeTone> = {
  pending: 'warning',
  approved: 'ok',
  rejected: 'exceeded',
}

// The visible text stays the raw status word (capitalised by CSS) exactly as
// before, so existing copy and assertions keep matching.
export function ExpenseStatusBadge({ status }: { status: string }) {
  const tone = EXPENSE_TONE[status as ExpenseStatusValue] ?? 'neutral'
  return (
    <Badge tone={tone} className="capitalize">
      {status}
    </Badge>
  )
}
