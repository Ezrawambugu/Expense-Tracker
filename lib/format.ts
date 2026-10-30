// Display helpers shared by server and client components.

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Expense dates are stored as UTC midnight; show the calendar date as entered.
export function formatDateOnly(iso: string): string {
  return iso.slice(0, 10)
}

export function todayDateOnly(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Percent used is a ratio (0.875 -> "87.5%").
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}

// Budget months are `YYYY-MM` strings (local calendar month for display).
export function currentMonth(): string {
  return todayDateOnly().slice(0, 7)
}

// The calendar month before a `YYYY-MM` string (2026-01 -> 2025-12).
export function previousMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number)
  return new Date(Date.UTC(year, mon - 2, 1)).toISOString().slice(0, 7)
}
