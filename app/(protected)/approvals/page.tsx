import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { listExpenses } from '@/services/expense-service'
import { ExpenseListQuerySchema } from '@/schemas/expense'
import { userNames } from '@/services/directory-service'
import { formatAmount, formatDateOnly } from '@/lib/format'
import { ReviewExpenseActions } from '@/components/review-expense-actions'

// Reads the session cookie on every request.
export const instant = false

export default async function ApprovalsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  // Staff never see the approvals queue; middleware also blocks the page.
  if (session.role === 'staff') redirect('/dashboard')

  // Pending expenses, oldest first so the queue is worked front to back.
  const query = ExpenseListQuerySchema.parse({
    status: 'pending',
    sortBy: 'date',
    sortDir: 'asc',
    pageSize: 100,
  })

  const result = await listExpenses(session, query)
  const names = await userNames(
    session,
    result.items.map((expense) => expense.userId),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {session.role === 'manager'
            ? 'Pending expenses in your department.'
            : 'Pending expenses across your organization (read-only).'}
        </p>
        {session.role === 'manager' && !session.departmentId && (
          <p className="mt-1 text-xs text-neutral-500">
            No department is assigned to you yet, so there is nothing to review.
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs tracking-wide text-neutral-500 uppercase dark:border-neutral-800">
            <tr>
              <th scope="col" className="px-4 py-3">
                Date
              </th>
              <th scope="col" className="px-4 py-3">
                Staff
              </th>
              <th scope="col" className="px-4 py-3">
                Category
              </th>
              <th scope="col" className="px-4 py-3">
                Description
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Amount
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Review</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-neutral-500"
                >
                  Nothing is awaiting approval.
                </td>
              </tr>
            ) : (
              result.items.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateOnly(expense.date)}
                  </td>
                  <td className="px-4 py-3">{names[expense.userId] ?? '—'}</td>
                  <td className="px-4 py-3">{expense.category}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    {expense.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                    {formatAmount(expense.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {session.role === 'manager' ? (
                      <ReviewExpenseActions expenseId={expense.id} />
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-neutral-500">
        {result.total === 100
          ? 'Showing the first 100 pending expenses.'
          : `${result.total} pending expense${result.total === 1 ? '' : 's'}.`}{' '}
        <Link href="/expenses?status=approved" className="underline">
          View approved expenses
        </Link>
      </p>
    </div>
  )
}
