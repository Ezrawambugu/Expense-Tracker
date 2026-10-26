import { describe, expect, it } from 'vitest'
import { csvCell, toCsv } from '@/lib/csv'
import { budgetToCsv, summaryToCsv } from '@/services/report-csv'
import type {
  BudgetVsActualRow,
  SummaryReport,
} from '@/services/report-service'

describe('csvCell', () => {
  it('passes plain text through untouched', () => {
    expect(csvCell('Transport')).toBe('Transport')
  })

  it('renders numbers as-is', () => {
    expect(csvCell(1234.5)).toBe('1234.5')
  })

  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
  })
})

describe('toCsv', () => {
  it('joins cells with commas and rows with CRLF', () => {
    expect(
      toCsv([
        ['a', 'b'],
        [1, 2],
      ]),
    ).toBe('a,b\r\n1,2\r\n')
  })

  it('renders an empty row as an empty line', () => {
    expect(toCsv([['a'], [], ['b']])).toBe('a\r\n\r\nb\r\n')
  })
})

const summary: SummaryReport = {
  month: '2026-10',
  totalApproved: 1400,
  awaitingApproval: 100,
  byCategory: [
    { category: 'Transport', total: 750 },
    { category: 'Meals', total: 400 },
    { category: 'Supplies', total: 250 },
    { category: 'Utilities', total: 0 },
    { category: 'Events', total: 0 },
    { category: 'Other', total: 0 },
  ],
  byDepartment: [{ departmentId: 'dept-1', name: 'Operations', total: 1400 }],
}

describe('summaryToCsv', () => {
  it('includes both totals, every category and every department', () => {
    const csv = summaryToCsv(summary)
    expect(csv).toContain('Expense summary,2026-10')
    expect(csv).toContain('Total approved,1400')
    expect(csv).toContain('Awaiting approval,100')
    expect(csv).toContain('Category,Approved')
    expect(csv).toContain('Transport,750')
    expect(csv).toContain('Department,Approved')
    expect(csv).toContain('Operations,1400')
  })
})

const budgetRow: BudgetVsActualRow = {
  departmentId: 'dept-1',
  departmentName: 'Operations',
  category: 'Meals',
  budget: 500,
  spent: 400,
  remaining: 100,
  percentUsed: 0.8,
  status: 'warning',
  awaitingApproval: 0,
}

describe('budgetToCsv', () => {
  it('writes one row per budget with all columns', () => {
    const csv = budgetToCsv([budgetRow])
    expect(csv).toContain(
      'Department,Category,Budget,Spent,Remaining,Percent used,Status,Awaiting approval',
    )
    expect(csv).toContain('Operations,Meals,500,400,100,80,warning,0')
  })

  it('quotes department names containing commas', () => {
    const csv = budgetToCsv([{ ...budgetRow, departmentName: 'Sales, North' }])
    expect(csv).toContain('"Sales, North",Meals')
  })
})
