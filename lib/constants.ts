// Shared domain constants. Imported by both server code and client forms,
// so keep this module free of server-only dependencies.

// Fixed category list from the master prompt (rule 3: category must be allowed).
export const CATEGORIES = [
  'Transport',
  'Supplies',
  'Meals',
  'Utilities',
  'Events',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const EXPENSE_STATUSES = ['pending', 'approved', 'rejected'] as const

export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]
