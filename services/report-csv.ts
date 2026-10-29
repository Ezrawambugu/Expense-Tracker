// CSV serialization for the Phase 4 report exports (pure functions, so they
// can be unit-tested without a database — report-service itself needs one).

import { toCsv } from '@/lib/csv'
import type {
  BudgetVsActualRow,
  SummaryReport,
} from '@/services/report-service'

export function summaryToCsv(report: SummaryReport): string {
  const rows: (string | number)[][] = [
    ['Expense summary', report.month],
    ['Total approved', report.totalApproved],
    ['Awaiting approval', report.awaitingApproval],
    [],
    ['Category', 'Approved'],
    ...report.byCategory.map((row) => [row.category, row.total]),
    [],
    ['Department', 'Approved'],
    ...report.byDepartment.map((row) => [row.name, row.total]),
  ]
  return toCsv(rows)
}

export function budgetToCsv(rows: BudgetVsActualRow[]): string {
  return toCsv([
    [
      'Department',
      'Category',
      'Budget',
      'Spent',
      'Remaining',
      'Percent used',
      'Status',
      'Awaiting approval',
    ],
    ...rows.map((row) => [
      row.departmentName,
      row.category,
      row.budget,
      row.spent,
      row.remaining,
      // Percent with one decimal (87.5 = 87.5% used).
      Math.round(row.percentUsed * 1000) / 10,
      row.status,
      row.awaitingApproval,
    ]),
  ])
}
