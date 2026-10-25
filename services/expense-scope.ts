// Read scope for expense queries, derived only from the verified session.
//
// Kept free of runtime dependencies (type-only imports) so the permission rules
// can be unit-tested without a database connection. Every query must also be
// filtered by the session's organizationId — this scope is only the per-role
// part of that filter.

import type { FilterQuery } from 'mongoose'
import type { Session } from '@/lib/auth'
import type { IExpense } from '@/models/expense'

// Review scope for pending approvals (Phase 3). Only managers approve or
// reject, and only within their own department; everyone else gets `null` so
// callers answer 403 rather than "not found".
export function reviewScope(session: Session): FilterQuery<IExpense> | null {
  if (session.role !== 'manager') return null
  return { departmentId: session.departmentId ?? { $in: [] } }
}

// staff -> own records, manager -> their department, admin -> whole org.
export function expenseScope(session: Session): FilterQuery<IExpense> {
  if (session.role === 'staff') return { userId: session.userId }
  if (session.role === 'manager') {
    // A manager without a department has no department scope, so match nothing.
    // Falling back to `departmentId: null` would expose every unassigned
    // user's expenses instead of just "their department".
    return { departmentId: session.departmentId ?? { $in: [] } }
  }
  return {}
}
