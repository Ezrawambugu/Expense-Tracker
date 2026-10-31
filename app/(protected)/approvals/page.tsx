import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCheck } from 'lucide-react'
import { getSession } from '@/lib/session'
import { listReviewQueue } from '@/services/expense-service'
import { ExpenseListQuerySchema } from '@/schemas/expense'
import { userNames } from '@/services/directory-service'
import { getOrganizationSettings } from '@/services/organization-service'
import { formatAmount, formatDateOnly } from '@/lib/format'
import { ReviewExpenseActions } from '@/components/review-expense-actions'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import {
  Table,
  TableContainer,
  TableEmpty,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui/table'

// Reads the session cookie on every request.
export const instant = false

export default async function ApprovalsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  // Staff never see the approvals queue; middleware also blocks the page.
  if (session.role === 'staff') redirect('/dashboard')

  // Pending expenses, oldest first so the queue is worked front to back.
  // listReviewQueue only returns records this role may actually decide.
  const query = ExpenseListQuerySchema.parse({
    status: 'pending',
    sortBy: 'date',
    sortDir: 'asc',
    pageSize: 100,
  })

  const [result, settings] = await Promise.all([
    listReviewQueue(session, query),
    getOrganizationSettings(session),
  ])
  const names = await userNames(
    session,
    result.items.map((expense) => expense.userId),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description={
          session.role === 'manager'
            ? 'Pending staff expenses in your department. Your own expenses are reviewed by an admin.'
            : 'Pending expenses submitted by managers in your organization. Staff expenses are reviewed by their department manager.'
        }
      />

      {session.role === 'manager' && !session.departmentId && (
        <p className="text-footnote text-muted">
          No department is assigned to you yet, so there is nothing to review.
        </p>
      )}

      <TableContainer>
        <Table className="min-w-0 sm:min-w-[48rem]">
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Date</TH>
              <TH>Submitted by</TH>
              <TH>Category</TH>
              <TH>Description</TH>
              <TH numeric>Amount</TH>
              <TH>
                <span className="sr-only">Review</span>
              </TH>
            </TR>
          </THead>
          <tbody>
            {result.items.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon={<Icon icon={CheckCheck} size={20} />}
                title="Nothing is waiting for you to review."
                description="New submissions from your queue show up here."
              />
            ) : (
              result.items.map((expense) => (
                <TR key={expense.id}>
                  <TD label="Date" className="whitespace-nowrap">
                    {formatDateOnly(expense.date)}
                  </TD>
                  <TD label="Submitted by">
                    {names[expense.userId] ?? '—'}
                    {session.role === 'admin' && (
                      <span className="text-caption text-muted ml-2">
                        manager
                      </span>
                    )}
                  </TD>
                  <TD label="Category">{expense.category}</TD>
                  <TD label="Description" className="text-muted">
                    {expense.description || '—'}
                  </TD>
                  <TD label="Amount" numeric>
                    {formatAmount(expense.amount, settings.currency)}
                  </TD>
                  <TD label="Review" className="sm:text-right">
                    <ReviewExpenseActions expenseId={expense.id} />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      <p className="text-footnote text-muted">
        {result.total === 100
          ? 'Showing the first 100 pending expenses.'
          : `${result.total} pending expense${result.total === 1 ? '' : 's'}.`}{' '}
        <Link
          href="/expenses?status=approved"
          className="text-accent-text font-medium hover:underline"
        >
          View approved expenses
        </Link>
      </p>
    </div>
  )
}
