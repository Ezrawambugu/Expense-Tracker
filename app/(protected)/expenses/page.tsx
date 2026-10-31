import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'
import { getSession } from '@/lib/session'
import { listExpenses } from '@/services/expense-service'
import { getOrganizationSettings } from '@/services/organization-service'
import { ExpenseListQuerySchema } from '@/schemas/expense'
import { formatAmount, formatDateOnly } from '@/lib/format'
import { CATEGORIES, EXPENSE_STATUSES } from '@/lib/constants'
import { DeleteExpenseButton } from '@/components/delete-expense-button'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/field'
import { Button, LinkButton } from '@/components/ui/button'
import { ExpenseStatusBadge } from '@/components/ui/badge'
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

// Reads the session cookie and search params on every request.
export const instant = false

type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const raw = await searchParams
  const rawQuery: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const v = first(value)
    if (v) rawQuery[key] = v
  }

  // Invalid query strings fall back to defaults instead of erroring the page.
  const parsed = ExpenseListQuerySchema.safeParse(rawQuery)
  const query = parsed.success ? parsed.data : ExpenseListQuerySchema.parse({})

  // Keep the parsed Date objects out of the URL builder.
  const queryStrings: Record<string, string> = {
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  }
  if (query.category) queryStrings.category = query.category
  if (query.status) queryStrings.status = query.status
  if (query.from) queryStrings.from = query.from.toISOString().slice(0, 10)
  if (query.to) queryStrings.to = query.to.toISOString().slice(0, 10)
  if (query.pageSize !== 20) queryStrings.pageSize = String(query.pageSize)

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { ...queryStrings, ...overrides }
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value)
    }
    const qs = params.toString()
    return qs ? `/expenses?${qs}` : '/expenses'
  }

  const [result, settings] = await Promise.all([
    listExpenses(session, query),
    getOrganizationSettings(session),
  ])

  const scopeNote: Record<typeof session.role, string> = {
    staff: 'Your expenses',
    manager: 'Expenses in your department, plus your own',
    admin: 'All expenses in your organization',
  }

  const sortLink = (field: 'date' | 'amount') => {
    const dir =
      query.sortBy === field && query.sortDir === 'desc' ? 'asc' : 'desc'
    return buildUrl({ sortBy: field, sortDir: dir, page: undefined })
  }

  const sortIndicator = (field: 'date' | 'amount') =>
    query.sortBy === field ? (query.sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const to = Math.min(result.page * result.pageSize, result.total)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description={scopeNote[session.role]}
        actions={
          /* Managers record their own expenses too (Phase 7B). */
          session.role !== 'admin' ? (
            <LinkButton href="/expenses/new">
              <Icon icon={Plus} size={16} />
              New expense
            </LinkButton>
          ) : undefined
        }
      />

      {session.role === 'manager' && !session.departmentId && (
        <p className="text-footnote text-muted">
          No department is assigned to you yet, so there are no expenses to
          show.
        </p>
      )}

      <Card className="p-4">
        <form
          method="get"
          action="/expenses"
          className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <input type="hidden" name="sortBy" value={query.sortBy} />
          <input type="hidden" name="sortDir" value={query.sortDir} />

          <Field id="category" label="Category">
            <Select
              id="category"
              name="category"
              defaultValue={query.category ?? ''}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="status" label="Status">
            <Select id="status" name="status" defaultValue={query.status ?? ''}>
              <option value="">All statuses</option>
              {EXPENSE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="from" label="From">
            <Input
              id="from"
              name="from"
              type="date"
              defaultValue={query.from?.toISOString().slice(0, 10) ?? ''}
            />
          </Field>

          <Field id="to" label="To">
            <Input
              id="to"
              name="to"
              type="date"
              defaultValue={query.to?.toISOString().slice(0, 10) ?? ''}
            />
          </Field>

          <div className="flex items-center gap-2">
            <Button type="submit" variant="tinted">
              Apply
            </Button>
            <Link
              href="/expenses"
              className="text-subheadline text-muted hover:text-foreground px-2 font-medium"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      {parsed.success === false && (
        <p className="text-exceeded-text text-footnote">
          Some filters were invalid, so the list shows the defaults.
        </p>
      )}

      <TableContainer>
        <Table className="min-w-0 sm:min-w-[44rem]">
          <caption className="sr-only">
            Expenses — page {result.page} of {result.totalPages}
          </caption>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>
                <Link
                  href={sortLink('date')}
                  className="hover:text-foreground"
                  aria-label={`Sort by date${sortIndicator('date')}`}
                >
                  Date{sortIndicator('date')}
                </Link>
              </TH>
              <TH>Category</TH>
              <TH>Description</TH>
              <TH numeric>
                <Link
                  href={sortLink('amount')}
                  className="hover:text-foreground"
                  aria-label={`Sort by amount${sortIndicator('amount')}`}
                >
                  Amount{sortIndicator('amount')}
                </Link>
              </TH>
              <TH>Status</TH>
              <TH>
                <span className="sr-only">Actions</span>
              </TH>
            </TR>
          </THead>
          <tbody>
            {result.items.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon={<Icon icon={Receipt} size={20} />}
                title="No expenses match these filters."
                description="Try a wider date range or clear the filters to see everything."
                action={
                  <LinkButton href="/expenses" variant="tinted" size="compact">
                    Clear filters
                  </LinkButton>
                }
              />
            ) : (
              result.items.map((expense) => {
                // Owner only, pending only — same rule for staff and managers
                // (an admin never owns an expense).
                const canManage =
                  expense.userId === session.userId &&
                  expense.status === 'pending'

                return (
                  <TR key={expense.id}>
                    <TD label="Date" className="whitespace-nowrap">
                      {formatDateOnly(expense.date)}
                    </TD>
                    <TD label="Category">{expense.category}</TD>
                    <TD label="Description" className="text-muted">
                      {expense.description || '—'}
                    </TD>
                    <TD label="Amount" numeric>
                      {formatAmount(expense.amount, settings.currency)}
                    </TD>
                    <TD label="Status">
                      <ExpenseStatusBadge status={expense.status} />
                      {expense.reviewNote && (
                        <span className="text-footnote text-muted mt-1 block max-w-56 text-left whitespace-normal">
                          {expense.reviewNote}
                        </span>
                      )}
                    </TD>
                    <TD label="Actions" className="sm:text-right">
                      {canManage ? (
                        <span className="flex items-center gap-3 sm:justify-end">
                          <Link
                            href={`/expenses/${expense.id}/edit`}
                            className="text-accent-text text-footnote font-medium hover:underline"
                          >
                            Edit
                          </Link>
                          <DeleteExpenseButton expenseId={expense.id} />
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TD>
                  </TR>
                )
              })
            )}
          </tbody>
        </Table>
      </TableContainer>

      <div className="text-footnote text-muted flex flex-wrap items-center justify-between gap-3">
        <p className="tabular-nums">
          Showing {from}–{to} of {result.total}
        </p>
        <div className="flex items-center gap-2">
          {result.page > 1 ? (
            <LinkButton
              href={buildUrl({ page: String(result.page - 1) })}
              variant="glass"
              size="compact"
            >
              Previous
            </LinkButton>
          ) : (
            <span className="rounded-control border-separator text-muted border px-3 py-1.5 opacity-45">
              Previous
            </span>
          )}
          <span className="tabular-nums">
            Page {result.page} of {result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <LinkButton
              href={buildUrl({ page: String(result.page + 1) })}
              variant="glass"
              size="compact"
            >
              Next
            </LinkButton>
          ) : (
            <span className="rounded-control border-separator text-muted border px-3 py-1.5 opacity-45">
              Next
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
