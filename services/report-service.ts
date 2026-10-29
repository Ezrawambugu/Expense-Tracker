// Report processing (Phase 4) — the MIS core: aggregation pipelines for the
// summary report, budget vs actual, monthly trends and budget alerts.
//
// All figures are computed in MongoDB, never in the UI, and every pipeline is
// filtered by the session's organizationId (rule 1) plus the per-role
// department scope from reportScope. Only approved expenses count toward
// spending totals; pending ones are reported separately as "awaiting
// approval" (rule 5). Status thresholds live in lib/budget-status.ts (rule 6).

import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import type { Session } from '@/lib/auth'
import { reportScope } from '@/services/report-scope'
import { Expense } from '@/models/expense'
import { Budget, type IBudget } from '@/models/budget'
import { Department } from '@/models/department'
import { CATEGORIES, type Category } from '@/lib/constants'
import {
  budgetStatus,
  percentUsed,
  type BudgetStatus,
} from '@/lib/budget-status'
import { currentMonth } from '@/lib/format'

export type CategoryTotal = { category: Category; total: number }

export type DepartmentTotal = {
  departmentId: string | null
  name: string
  total: number
}

export type SummaryReport = {
  month: string
  totalApproved: number
  awaitingApproval: number
  byCategory: CategoryTotal[]
  byDepartment: DepartmentTotal[]
}

export type BudgetVsActualRow = {
  departmentId: string
  departmentName: string
  category: Category
  budget: number
  spent: number
  remaining: number
  // Ratio (0.85 = 85% used); status derives from it via the threshold config.
  percentUsed: number
  status: BudgetStatus
  awaitingApproval: number
}

export type TrendPoint = { month: string; total: number }

// `month` is `YYYY-MM` (validated by the callers' schemas). Expenses are
// stored at UTC midnight, so the range is the UTC calendar month.
function monthRange(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split('-').map(Number)
  return {
    start: new Date(Date.UTC(year, mon - 1, 1)),
    end: new Date(Date.UTC(year, mon, 1)),
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// Aggregation pipelines don't go through Mongoose's schema casting, so ids
// must become real ObjectIds before they reach $match.
function matchScope(session: Session): Record<string, unknown> {
  const scope = reportScope(session)
  if (scope.departmentId === undefined) return {}
  if (typeof scope.departmentId === 'string') {
    return { departmentId: new mongoose.Types.ObjectId(scope.departmentId) }
  }
  // `{ $in: [] }` — a user with no department matches nothing.
  return { departmentId: scope.departmentId }
}

function orgMatch(session: Session): Record<string, unknown> {
  return { organizationId: new mongoose.Types.ObjectId(session.organizationId) }
}

type SummaryFacet = {
  byCategory: { _id: Category; total: number }[]
  byDepartment: { _id: mongoose.Types.ObjectId | null; total: number }[]
  pending: { _id: null; total: number }[]
}

// a) Summary report: approved spending for a month, split by category and
// department, plus the pending total shown separately.
export async function summaryReport(
  session: Session,
  month: string,
): Promise<SummaryReport> {
  await connectDB()

  const { start, end } = monthRange(month)

  const [facet] = await Expense.aggregate<SummaryFacet>([
    {
      $match: {
        ...orgMatch(session),
        ...matchScope(session),
        date: { $gte: start, $lt: end },
      },
    },
    {
      $facet: {
        byCategory: [
          { $match: { status: 'approved' } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
        ],
        byDepartment: [
          { $match: { status: 'approved' } },
          { $group: { _id: '$departmentId', total: { $sum: '$amount' } } },
        ],
        pending: [
          { $match: { status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ],
      },
    },
  ])

  // Fixed category order, zero-filled so rows line up with the charts.
  const categoryTotals = new Map(
    (facet?.byCategory ?? []).map((row) => [row._id, row.total]),
  )
  const byCategory: CategoryTotal[] = CATEGORIES.map((category) => ({
    category,
    total: round2(categoryTotals.get(category) ?? 0),
  }))

  const departmentTotals = new Map(
    (facet?.byDepartment ?? []).map((row) => [
      row._id ? String(row._id) : null,
      row.total,
    ]),
  )
  const scope = reportScope(session)
  // The scope keys on `departmentId`; the Department collection's own key is
  // `_id`, so map the scope across before the lookup.
  const departments = await Department.find({
    organizationId: session.organizationId,
    ...(scope.departmentId !== undefined ? { _id: scope.departmentId } : {}),
  })
    .select('name')
    .sort({ name: 1 })
    .lean<{ _id: mongoose.Types.ObjectId; name: string }[]>()

  const byDepartment: DepartmentTotal[] = departments.map((dept) => ({
    departmentId: String(dept._id),
    name: dept.name,
    total: round2(departmentTotals.get(String(dept._id)) ?? 0),
  }))
  // Expenses authored by users without a department.
  const unassigned = departmentTotals.get(null)
  if (unassigned !== undefined) {
    byDepartment.push({
      departmentId: null,
      name: 'Unassigned',
      total: round2(unassigned),
    })
  }

  const totalApproved = round2(
    byCategory.reduce((sum, row) => sum + row.total, 0),
  )
  const awaitingApproval = round2(facet?.pending?.[0]?.total ?? 0)

  return { month, totalApproved, awaitingApproval, byCategory, byDepartment }
}

type SpendRow = {
  _id: {
    departmentId: mongoose.Types.ObjectId | null
    category: Category
    status: 'approved' | 'pending'
  }
  total: number
}

// b) Budget vs actual: one row per budget with spent, remaining, percent
// used and status. Only approved expenses count as spent (rule 5).
export async function budgetVsActual(
  session: Session,
  month: string,
): Promise<BudgetVsActualRow[]> {
  await connectDB()

  const { start, end } = monthRange(month)

  const budgets = await Budget.find({
    organizationId: session.organizationId,
    ...reportScope(session),
    month,
  }).lean<IBudget[]>()
  if (budgets.length === 0) return []

  const spend = await Expense.aggregate<SpendRow>([
    {
      $match: {
        ...orgMatch(session),
        ...matchScope(session),
        date: { $gte: start, $lt: end },
        status: { $in: ['approved', 'pending'] },
      },
    },
    {
      $group: {
        _id: {
          departmentId: '$departmentId',
          category: '$category',
          status: '$status',
        },
        total: { $sum: '$amount' },
      },
    },
  ])

  const totals = new Map<string, number>()
  for (const row of spend) {
    const key = `${row._id.departmentId ?? ''}|${row._id.category}|${row._id.status}`
    totals.set(key, (totals.get(key) ?? 0) + row.total)
  }

  const names = await departmentNamesByIds(
    session,
    budgets.map((b) => String(b.departmentId)),
  )

  const rows: BudgetVsActualRow[] = budgets.map((budget) => {
    const departmentId = String(budget.departmentId)
    const spent = round2(
      totals.get(`${departmentId}|${budget.category}|approved`) ?? 0,
    )
    const awaiting = round2(
      totals.get(`${departmentId}|${budget.category}|pending`) ?? 0,
    )
    const ratio = percentUsed(spent, budget.amount)
    return {
      departmentId,
      departmentName: names[departmentId] ?? 'Unknown department',
      category: budget.category,
      budget: budget.amount,
      spent,
      remaining: round2(budget.amount - spent),
      percentUsed: ratio,
      status: budgetStatus(ratio),
      awaitingApproval: awaiting,
    }
  })

  // Stable, readable order: department name, then the fixed category order.
  return rows.sort(
    (a, b) =>
      a.departmentName.localeCompare(b.departmentName) ||
      CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category),
  )
}

// c) Alerts: the budget rows that need attention, worst first.
export async function budgetAlerts(
  session: Session,
  month: string = currentMonth(),
): Promise<BudgetVsActualRow[]> {
  const rows = await budgetVsActual(session, month)
  return rows
    .filter((row) => row.status !== 'ok')
    .sort((a, b) => b.percentUsed - a.percentUsed)
}

// d) Trends: approved spending per month for the last `months` months,
// zero-filled so the line chart has a point for every month.
export async function spendingTrends(
  session: Session,
  months = 6,
): Promise<TrendPoint[]> {
  await connectDB()

  const anchor = currentMonth()
  const [year, mon] = anchor.split('-').map(Number)
  const labels: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    labels.push(
      new Date(Date.UTC(year, mon - 1 - i, 1)).toISOString().slice(0, 7),
    )
  }

  const { start } = monthRange(labels[0])
  const { end } = monthRange(labels[labels.length - 1])

  const spend = await Expense.aggregate<{ _id: string; total: number }>([
    {
      $match: {
        ...orgMatch(session),
        ...matchScope(session),
        status: 'approved',
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        total: { $sum: '$amount' },
      },
    },
  ])

  const totals = new Map(spend.map((row) => [row._id, row.total]))
  return labels.map((month) => ({
    month,
    total: round2(totals.get(month) ?? 0),
  }))
}

async function departmentNamesByIds(
  session: Session,
  ids: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids)].filter((id) => mongoose.isValidObjectId(id))
  if (unique.length === 0) return {}

  const docs = await Department.find({
    organizationId: session.organizationId,
    _id: { $in: unique },
  })
    .select('name')
    .lean<{ _id: mongoose.Types.ObjectId; name: string }[]>()

  return Object.fromEntries(docs.map((doc) => [String(doc._id), doc.name]))
}
