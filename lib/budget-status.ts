// Budget status thresholds (business rule 6), kept in ONE config constant:
// below 80% = ok, 80% to 100% = warning, above 100% = exceeded.
// Imported by server reports and client rendering, so keep it dependency-free.

export const BUDGET_THRESHOLDS = {
  // percentUsed at or above this ratio is a warning.
  warning: 0.8,
  // percentUsed above this ratio is exceeded (exactly 100% stays a warning).
  exceeded: 1,
} as const

export type BudgetStatus = 'ok' | 'warning' | 'exceeded'

// spent / budget as a ratio (0.85 = 85% used). Budgets are > 0 by schema;
// the guard keeps a zero budget from producing Infinity.
export function percentUsed(spent: number, budget: number): number {
  return budget > 0 ? spent / budget : 0
}

export function budgetStatus(ratio: number): BudgetStatus {
  if (ratio > BUDGET_THRESHOLDS.exceeded) return 'exceeded'
  if (ratio >= BUDGET_THRESHOLDS.warning) return 'warning'
  return 'ok'
}
