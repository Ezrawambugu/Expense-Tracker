import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wallet } from 'lucide-react'
import { getSession } from '@/lib/session'
import { listBudgets } from '@/services/budget-service'
import { BudgetListQuerySchema } from '@/schemas/budget'
import { departmentNames } from '@/services/directory-service'
import { getOrganizationSettings } from '@/services/organization-service'
import { formatAmount, currentMonth } from '@/lib/format'
import { CATEGORIES } from '@/lib/constants'
import { BudgetForm } from '@/components/budget-form'
import { CopyBudgetsForm } from '@/components/copy-budgets-form'
import { DeleteBudgetButton } from '@/components/delete-budget-button'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/field'
import { Button, LinkButton } from '@/components/ui/button'
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

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  // Staff have no budget access in this phase.
  if (session.role === 'staff') redirect('/dashboard')

  const raw = await searchParams
  const rawQuery: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const v = first(value)
    if (v) rawQuery[key] = v
  }

  // Invalid query strings fall back to defaults instead of erroring the page.
  const parsed = BudgetListQuerySchema.safeParse(rawQuery)
  const query = parsed.success ? parsed.data : {}
  const [result, settings] = await Promise.all([
    listBudgets(session, query),
    getOrganizationSettings(session),
  ])

  const canEdit = session.role === 'manager' && !!session.departmentId
  const names =
    session.role === 'admin'
      ? await departmentNames(
          session,
          result.items.map((b) => b.departmentId),
        )
      : {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description={
          session.role === 'manager'
            ? 'Category budgets for your department.'
            : 'All department budgets in your organization (read-only).'
        }
      />

      {session.role === 'manager' && !session.departmentId && (
        <p className="text-footnote text-muted">
          No department is assigned to you yet, so you cannot set budgets.
        </p>
      )}

      {canEdit && (
        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Set a budget"
            description="One amount per category and month."
          />
          <div className="mt-5">
            <BudgetForm
              mode="create"
              idPrefix="new-budget"
              initial={{ month: query.month ?? currentMonth() }}
            />
          </div>
        </Card>
      )}

      {canEdit && (
        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Copy budgets from a month"
            description="Start a new month from an existing one instead of retyping every category."
          />
          <div className="mt-5">
            <CopyBudgetsForm />
          </div>
        </Card>
      )}

      <Card className="p-4">
        <form
          method="get"
          action="/budgets"
          className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3"
        >
          <Field id="month" label="Month">
            <Input
              id="month"
              name="month"
              type="month"
              defaultValue={query.month ?? ''}
            />
          </Field>

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

          <div className="flex items-center gap-2">
            <Button type="submit" variant="tinted">
              Apply
            </Button>
            <Link
              href="/budgets"
              className="text-subheadline text-muted hover:text-foreground px-2 font-medium"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      {parsed.success === false && (
        <p className="text-exceeded-text text-footnote">
          Some filters were invalid, so the list shows all budgets.
        </p>
      )}

      <TableContainer>
        <Table className="min-w-0 sm:min-w-[34rem]">
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Month</TH>
              <TH>Category</TH>
              {session.role === 'admin' && <TH>Department</TH>}
              <TH numeric>Amount</TH>
              {canEdit && (
                <TH>
                  <span className="sr-only">Actions</span>
                </TH>
              )}
            </TR>
          </THead>
          <tbody>
            {result.items.length === 0 ? (
              <TableEmpty
                colSpan={4}
                icon={<Icon icon={Wallet} size={20} />}
                title="No budgets yet."
                description={
                  canEdit
                    ? 'Set the first one above, or copy a month you already planned.'
                    : 'A manager sets budgets for their department.'
                }
              />
            ) : (
              result.items.map((budget) => (
                <TR key={budget.id}>
                  <TD label="Month" className="whitespace-nowrap tabular-nums">
                    {budget.month}
                  </TD>
                  <TD label="Category">{budget.category}</TD>
                  {session.role === 'admin' && (
                    <TD label="Department" className="text-muted">
                      {names[budget.departmentId] ?? '—'}
                    </TD>
                  )}
                  <TD label="Amount" numeric>
                    {formatAmount(budget.amount, settings.currency)}
                    {budget.carryOver && (
                      <span className="text-caption text-muted mt-0.5 block font-normal">
                        carries over
                      </span>
                    )}
                  </TD>
                  {canEdit && (
                    <TD label="Actions" className="sm:text-right">
                      <span className="flex items-center gap-3 sm:justify-end">
                        <Link
                          href={`/budgets/${budget.id}/edit`}
                          className="text-accent-text text-footnote font-medium hover:underline"
                        >
                          Edit
                        </Link>
                        <DeleteBudgetButton budgetId={budget.id} />
                      </span>
                    </TD>
                  )}
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      <p className="text-footnote text-muted tabular-nums">
        {result.total} budget{result.total === 1 ? '' : 's'}
        {query.month ? ` for ${query.month}` : ''}.
      </p>

      {result.total === 0 && !canEdit && (
        <LinkButton href="/reports" variant="tinted" size="compact">
          Open reports
        </LinkButton>
      )}
    </div>
  )
}
