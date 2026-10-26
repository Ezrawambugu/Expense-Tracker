import { describe, expect, it } from 'vitest'
import { reviewScope } from '@/services/expense-scope'
import { budgetScope } from '@/services/budget-scope'
import type { Session } from '@/lib/auth'

const base: Session = {
  userId: 'user-1',
  organizationId: 'org-1',
  departmentId: 'dept-1',
  role: 'manager',
}

describe('reviewScope', () => {
  it('limits managers to their department', () => {
    expect(reviewScope(base)).toEqual({ departmentId: 'dept-1' })
  })

  it('does not let admins approve — only managers review in Phase 3', () => {
    expect(reviewScope({ ...base, role: 'admin' })).toBeNull()
  })

  it('never lets staff review, even if they reach the service', () => {
    expect(reviewScope({ ...base, role: 'staff' })).toBeNull()
  })

  it('does not fall back to department-less records for a manager with no department', () => {
    const scope = reviewScope({ ...base, departmentId: null })
    expect(scope).not.toEqual({ departmentId: null })
    expect(scope).toEqual({ departmentId: { $in: [] } })
  })
})

describe('budgetScope', () => {
  it('limits managers to their department', () => {
    expect(budgetScope(base)).toEqual({ departmentId: 'dept-1' })
  })

  it('gives admins the whole organization', () => {
    expect(budgetScope({ ...base, role: 'admin' })).toEqual({})
  })

  it('denies staff any budget access', () => {
    expect(budgetScope({ ...base, role: 'staff' })).toBeNull()
  })

  it('matches nothing for a manager without a department', () => {
    expect(budgetScope({ ...base, departmentId: null })).toEqual({
      departmentId: { $in: [] },
    })
  })
})
