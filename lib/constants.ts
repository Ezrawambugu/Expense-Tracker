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

// Roles from the master prompt. Lives here (not models/user.ts) so admin
// forms and schemas can use it without pulling mongoose into the browser.
export const USER_ROLES = ['admin', 'manager', 'staff'] as const

export type UserRole = (typeof USER_ROLES)[number]
