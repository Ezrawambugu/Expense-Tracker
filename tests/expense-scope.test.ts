import { describe, expect, it } from 'vitest'
import { expenseScope } from '@/services/expense-scope'
import type { Session } from '@/lib/auth'

const base: Session = {
  userId: 'user-1',
  organizationId: 'org-1',
  departmentId: 'dept-1',
  role: 'staff',
}

describe('expenseScope', () => {
  it('limits staff to their own records', () => {
    expect(expenseScope(base)).toEqual({ userId: 'user-1' })
  })

  it('limits managers to their department', () => {
    expect(expenseScope({ ...base, role: 'manager' })).toEqual({
      departmentId: 'dept-1',
    })
  })

  it('does not fall back to department-less records for a manager with no department', () => {
    const scope = expenseScope({
      ...base,
      role: 'manager',
      departmentId: null,
    })
    // Must not mean "every expense whose author has no department".
    expect(scope).not.toEqual({ departmentId: null })
    expect(scope.departmentId).toEqual({ $in: [] })
  })

  it('gives admins the whole organization (org filter is applied by the service)', () => {
    expect(expenseScope({ ...base, role: 'admin' })).toEqual({})
  })
})
