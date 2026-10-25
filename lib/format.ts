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

// Budget months are `YYYY-MM` strings (local calendar month for display).
export function currentMonth(): string {
  return todayDateOnly().slice(0, 7)
}
