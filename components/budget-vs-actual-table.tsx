import { formatAmount, formatPercent } from '@/lib/format'
import type { BudgetVsActualRow } from '@/services/report-service'
import { StatusBadge } from '@/components/ui/badge'
import { TD, TR, Table, TableContainer, THead, TH } from '@/components/ui/table'

// Rule 6 thresholds are reflected here only as colours; the values themselves
// come from the service via lib/budget-status.ts (or the organization's own
// warning threshold since Phase 7C). Phase 8B delegates the badge to the
// shared status badge so budget and expense statuses stay visually consistent.
export function BudgetStatusBadge({
  status,
}: {
  status: BudgetVsActualRow['status']
}) {
  return <StatusBadge status={status} />
}

// Server-rendered budget vs actual table. The column set adapts to the
// audience: admins see every department, everyone sees the awaiting-approval
// column because pending expenses never count toward spending (rule 5).
// Unbudgeted rows (approved spending without a budget) show dashes for the
// budget figures (Phase 7C).
export function BudgetVsActualTable({
  rows,
  currency,
  showDepartment = false,
  emptyMessage = 'No budgets for this month yet.',
}: {
  rows: BudgetVsActualRow[]
  currency: string
  showDepartment?: boolean
  emptyMessage?: string
}) {
  const colSpan = (showDepartment ? 1 : 0) + 9

  const money = (value: number | null) =>
    value === null ? '—' : formatAmount(value, currency)

  return (
    <TableContainer>
      <Table className="min-w-0 sm:min-w-[48rem]">
        <THead>
          <TR className="hover:bg-transparent">
            {showDepartment && <TH>Department</TH>}
            <TH>Category</TH>
            <TH numeric>Budget</TH>
            <TH numeric>Carried over</TH>
            <TH numeric>Available</TH>
            <TH numeric>Spent</TH>
            <TH numeric>Remaining</TH>
            <TH numeric>Used</TH>
            <TH>Status</TH>
            <TH numeric>Awaiting</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={colSpan}
                className="text-muted px-4 py-10 text-center"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <TR key={`${row.departmentId}-${row.category}`}>
                {showDepartment && (
                  <TD label="Department" className="text-muted">
                    {row.departmentName}
                  </TD>
                )}
                <TD label="Category">{row.category}</TD>
                <TD label="Budget" numeric>
                  {money(row.budget)}
                </TD>
                <TD label="Carried over" numeric>
                  {row.carriedOver
                    ? formatAmount(row.carriedOver, currency)
                    : '—'}
                </TD>
                <TD label="Available" numeric>
                  {money(row.available)}
                </TD>
                <TD label="Spent" numeric>
                  {formatAmount(row.spent, currency)}
                </TD>
                <TD label="Remaining" numeric>
                  {money(row.remaining)}
                </TD>
                <TD label="Used" numeric>
                  {row.percentUsed === null
                    ? '—'
                    : formatPercent(row.percentUsed)}
                </TD>
                <TD label="Status">
                  <BudgetStatusBadge status={row.status} />
                </TD>
                <TD label="Awaiting" numeric>
                  {formatAmount(row.awaitingApproval, currency)}
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </Table>
    </TableContainer>
  )
}
