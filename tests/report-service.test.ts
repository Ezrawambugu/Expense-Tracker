// Report aggregation functions (Phase 4/6): the DB boundary is mocked so the
// processing logic — scoping, grouping, zero-fill, rounding, status
// derivation and alert ordering — is tested without a real MongoDB.
//
// Business rules covered here: rule 1 (every pipeline is filtered by the
// session's organizationId), rule 5 (only approved expenses count as spent;
// pending is reported separately) and rule 6 (status derives from the shared
// threshold config).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import mongoose from 'mongoose'
import type { Session } from '@/lib/auth'
import { CATEGORIES } from '@/lib/constants'

vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => null) }))
vi.mock('@/models/expense', () => ({ Expense: { aggregate: vi.fn() } }))
vi.mock('@/models/budget', () => ({ Budget: { find: vi.fn() } }))
vi.mock('@/models/department', () => ({ Department: { find: vi.fn() } }))

const { Expense } = await import('@/models/expense')
const { Budget } = await import('@/models/budget')
const { Department } = await import('@/models/department')
const { summaryReport, budgetVsActual, budgetAlerts, spendingTrends } =
  await import('@/services/report-service')

const aggregate = Expense.aggregate as unknown as Mock
const budgetFind = Budget.find as unknown as Mock
const departmentFind = Department.find as unknown as Mock

const ORG = '64b000000000000000000001'
const DEPT = '64b000000000000000000002'
const MONTH = '2026-10'

const manager: Session = {
  userId: 'user-1',
  organizationId: ORG,
  departmentId: DEPT,
  role: 'manager',
}
const admin: Session = {
  userId: 'user-2',
  organizationId: ORG,
  departmentId: null,
  role: 'admin',
}

// A chainable query stub: find().select().sort().lean().
type Chain<T> = {
  select: () => Chain<T>
  sort: () => Chain<T>
  lean: () => Promise<T>
}
function query<T>(result: T): Chain<T> {
  const q: Chain<T> = {
    select: () => q,
    sort: () => q,
    lean: async () => result,
  }
  return q
}

type Call = unknown[]
function matchOf(call: Call): Record<string, unknown> {
  const pipeline = call[0] as { $match: Record<string, unknown> }[]
  return pipeline[0].$match
}

beforeEach(() => {
  aggregate.mockReset()
  budgetFind.mockReset()
  departmentFind.mockReset()
  departmentFind.mockReturnValue(query([]))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('summaryReport', () => {
  it('returns every category in the fixed order, zero-filled', async () => {
    aggregate.mockResolvedValue([
      {
        byCategory: [
          { _id: 'Meals', total: 420 },
          { _id: 'Transport', total: 750 },
        ],
        byDepartment: [{ _id: DEPT, total: 1170 }],
        pending: [{ _id: null, total: 180 }],
      },
    ])
    departmentFind.mockReturnValue(query([{ _id: DEPT, name: 'Operations' }]))

    const report = await summaryReport(manager, MONTH)

    expect(report.byCategory.map((row) => row.category)).toEqual(CATEGORIES)
    // Zero-filled rows for the categories without spending.
    expect(report.byCategory.find((r) => r.category === 'Supplies')).toEqual({
      category: 'Supplies',
      total: 0,
    })
    expect(
      report.byCategory.find((r) => r.category === 'Transport')?.total,
    ).toBe(750)
    expect(report.totalApproved).toBe(1170)
    // Rule 5: pending is reported separately, never inside the total.
    expect(report.awaitingApproval).toBe(180)
    expect(report.byDepartment).toEqual([
      { departmentId: DEPT, name: 'Operations', total: 1170 },
    ])
  })

  it('rounds money to two decimals', async () => {
    aggregate.mockResolvedValue([
      {
        byCategory: [
          { _id: 'Transport', total: 10.005 },
          { _id: 'Meals', total: 1.234 },
        ],
        byDepartment: [],
        pending: [],
      },
    ])

    const report = await summaryReport(admin, MONTH)

    expect(
      report.byCategory.find((r) => r.category === 'Transport')?.total,
    ).toBe(10.01)
    expect(report.totalApproved).toBe(11.24)
    expect(report.awaitingApproval).toBe(0)
  })

  it('lists department-less spending as "Unassigned"', async () => {
    aggregate.mockResolvedValue([
      {
        byCategory: [{ _id: 'Transport', total: 50 }],
        byDepartment: [{ _id: null, total: 50 }],
        pending: [],
      },
    ])

    const report = await summaryReport(admin, MONTH)

    expect(report.byDepartment).toEqual([
      { departmentId: null, name: 'Unassigned', total: 50 },
    ])
  })

  it('scopes the pipeline to the organization and the manager department (rule 1)', async () => {
    aggregate.mockResolvedValue([
      { byCategory: [], byDepartment: [], pending: [] },
    ])
    departmentFind.mockReturnValue(query([]))

    await summaryReport(manager, MONTH)

    const match = matchOf(aggregate.mock.calls[0])
    expect(match.organizationId).toEqual(new mongoose.Types.ObjectId(ORG))
    expect(match.departmentId).toEqual(new mongoose.Types.ObjectId(DEPT))
    expect(match.date).toEqual({
      $gte: new Date(Date.UTC(2026, 9, 1)),
      $lt: new Date(Date.UTC(2026, 10, 1)),
    })
  })

  it('leaves the department filter off for an admin (whole organization)', async () => {
    aggregate.mockResolvedValue([
      { byCategory: [], byDepartment: [], pending: [] },
    ])
    departmentFind.mockReturnValue(query([]))

    await summaryReport(admin, MONTH)

    const match = matchOf(aggregate.mock.calls[0])
    expect(match.organizationId).toEqual(new mongoose.Types.ObjectId(ORG))
    expect(match.departmentId).toBeUndefined()
    // The department lookup is org-scoped too.
    expect(departmentFind).toHaveBeenCalledWith({ organizationId: ORG })
  })
})

describe('budgetVsActual', () => {
  const budgets = [
    {
      _id: 'b1',
      departmentId: DEPT,
      category: 'Transport',
      amount: 1000,
      month: MONTH,
    },
    {
      _id: 'b2',
      departmentId: DEPT,
      category: 'Meals',
      amount: 500,
      month: MONTH,
    },
  ]

  it('counts only approved spend as spent and reports pending separately (rule 5)', async () => {
    budgetFind.mockReturnValue(query(budgets))
    aggregate.mockResolvedValue([
      {
        _id: { departmentId: DEPT, category: 'Transport', status: 'approved' },
        total: 750,
      },
      {
        _id: { departmentId: DEPT, category: 'Transport', status: 'pending' },
        total: 60,
      },
      {
        _id: { departmentId: DEPT, category: 'Meals', status: 'approved' },
        total: 420,
      },
    ])
    departmentFind.mockReturnValue(query([{ _id: DEPT, name: 'Operations' }]))

    const rows = await budgetVsActual(manager, MONTH)

    expect(rows).toHaveLength(2)
    const transport = rows.find((r) => r.category === 'Transport')!
    expect(transport).toMatchObject({
      departmentName: 'Operations',
      budget: 1000,
      spent: 750,
      remaining: 250,
      percentUsed: 0.75,
      status: 'ok',
      awaitingApproval: 60,
    })
    // 420/500 = 84% -> warning (rule 6 thresholds).
    const meals = rows.find((r) => r.category === 'Meals')!
    expect(meals).toMatchObject({
      spent: 420,
      remaining: 80,
      percentUsed: 0.84,
      status: 'warning',
      awaitingApproval: 0,
    })
  })

  it('sorts rows by department name, then the fixed category order', async () => {
    // departmentNamesByIds drops ids that are not valid ObjectIds, so the
    // fixture departments must be real 24-hex ids.
    const DEPT_Z = '64b000000000000000000003'
    const DEPT_A = '64b000000000000000000004'
    budgetFind.mockReturnValue(
      query([
        {
          _id: 'b3',
          departmentId: DEPT_Z,
          category: 'Meals',
          amount: 100,
          month: MONTH,
        },
        {
          _id: 'b4',
          departmentId: DEPT_Z,
          category: 'Transport',
          amount: 100,
          month: MONTH,
        },
        {
          _id: 'b5',
          departmentId: DEPT_A,
          category: 'Events',
          amount: 100,
          month: MONTH,
        },
      ]),
    )
    aggregate.mockResolvedValue([])
    departmentFind.mockReturnValue(
      query([
        { _id: DEPT_Z, name: 'Zebra' },
        { _id: DEPT_A, name: 'Alpha' },
      ]),
    )

    const rows = await budgetVsActual(admin, MONTH)

    expect(rows.map((r) => `${r.departmentName}:${r.category}`)).toEqual([
      'Alpha:Events',
      'Zebra:Transport',
      'Zebra:Meals',
    ])
  })

  it('falls back to "Unknown department" when the lookup misses', async () => {
    budgetFind.mockReturnValue(query(budgets))
    aggregate.mockResolvedValue([])
    departmentFind.mockReturnValue(query([]))

    const rows = await budgetVsActual(manager, MONTH)

    expect(rows.every((r) => r.departmentName === 'Unknown department')).toBe(
      true,
    )
  })

  it('returns nothing (and skips the aggregation) when there are no budgets', async () => {
    budgetFind.mockReturnValue(query([]))

    expect(await budgetVsActual(admin, MONTH)).toEqual([])
    expect(aggregate).not.toHaveBeenCalled()
  })

  it('always filters by the organization (rule 1)', async () => {
    budgetFind.mockReturnValue(query(budgets))
    aggregate.mockResolvedValue([])
    departmentFind.mockReturnValue(query([]))

    await budgetVsActual(manager, MONTH)

    expect(budgetFind).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG, month: MONTH }),
    )
    const match = matchOf(aggregate.mock.calls[0])
    expect(match.organizationId).toEqual(new mongoose.Types.ObjectId(ORG))
    expect(match.departmentId).toEqual(new mongoose.Types.ObjectId(DEPT))
  })
})

describe('budgetAlerts', () => {
  it('drops ok rows and orders the rest worst first', async () => {
    budgetFind.mockReturnValue(
      query([
        {
          _id: 'b1',
          departmentId: DEPT,
          category: 'Transport',
          amount: 1000,
          month: MONTH,
        },
        {
          _id: 'b2',
          departmentId: DEPT,
          category: 'Meals',
          amount: 500,
          month: MONTH,
        },
        {
          _id: 'b3',
          departmentId: DEPT,
          category: 'Supplies',
          amount: 200,
          month: MONTH,
        },
      ]),
    )
    aggregate.mockResolvedValue([
      // 500/1000 = 50% -> ok (no alert).
      {
        _id: { departmentId: DEPT, category: 'Transport', status: 'approved' },
        total: 500,
      },
      // 450/500 = 90% -> warning.
      {
        _id: { departmentId: DEPT, category: 'Meals', status: 'approved' },
        total: 450,
      },
      // 250/200 = 125% -> exceeded.
      {
        _id: { departmentId: DEPT, category: 'Supplies', status: 'approved' },
        total: 250,
      },
    ])
    departmentFind.mockReturnValue(query([{ _id: DEPT, name: 'Operations' }]))

    const alerts = await budgetAlerts(manager, MONTH)

    expect(alerts.map((row) => row.category)).toEqual(['Supplies', 'Meals'])
    expect(alerts.map((row) => row.status)).toEqual(['exceeded', 'warning'])
  })
})

describe('spendingTrends', () => {
  it('returns the last six months ascending, zero-filled', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 29, 12))
    aggregate.mockResolvedValue([
      { _id: '2026-08', total: 840.5 },
      { _id: '2026-10', total: 1420 },
    ])

    const trends = await spendingTrends(manager, 6)

    expect(trends.map((point) => point.month)).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ])
    expect(trends.map((point) => point.total)).toEqual([
      0, 0, 0, 840.5, 0, 1420,
    ])
  })

  it('aggregates approved spending only, scoped to the organization (rules 1 and 5)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 29, 12))
    aggregate.mockResolvedValue([])

    await spendingTrends(admin, 6)

    const match = matchOf(aggregate.mock.calls[0])
    expect(match.organizationId).toEqual(new mongoose.Types.ObjectId(ORG))
    expect(match.status).toBe('approved')
    expect(match.date).toEqual({
      $gte: new Date(Date.UTC(2026, 4, 1)),
      $lt: new Date(Date.UTC(2026, 10, 1)),
    })
  })
})
