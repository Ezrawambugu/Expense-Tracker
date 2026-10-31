import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChartColumn, Clock, ChartLine, ArrowDownToLine } from 'lucide-react'
import { getSession } from '@/lib/session'
import { ReportQuerySchema } from '@/schemas/report'
import {
  budgetVsActual,
  spendingTrends,
  summaryReport,
} from '@/services/report-service'
import { getOrganizationSettings } from '@/services/organization-service'
import { currentMonth, formatAmount } from '@/lib/format'
import { BudgetVsActualTable } from '@/components/budget-vs-actual-table'
import { CategoryChart, TrendChart } from '@/components/report-charts'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Table, TableContainer, TD, TH, THead, TR } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'

// Reads the session cookie and search params on every request.
export const instant = false

type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function BreakdownTable({
  caption,
  rows,
  currency,
}: {
  caption: string
  rows: { name: string; total: number }[]
  currency: string
}) {
  return (
    <TableContainer>
      <Table>
        <THead>
          <TR className="hover:bg-transparent">
            <TH>{caption}</TH>
            <TH numeric>Approved</TH>
          </TR>
        </THead>
        <tbody>
          {rows.map((row) => (
            <TR key={row.name}>
              <TD label={caption}>{row.name}</TD>
              <TD label="Approved" numeric>
                {formatAmount(row.total, currency)}
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  )
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  // Staff read their department's budget status from the dashboard instead;
  // middleware already 403s this path for them.
  if (session.role === 'staff') redirect('/dashboard')

  const raw = await searchParams
  const parsed = ReportQuerySchema.safeParse({ month: first(raw.month) })
  const monthInvalid = !parsed.success && first(raw.month) !== undefined
  const month = parsed.success
    ? (parsed.data.month ?? currentMonth())
    : currentMonth()

  const [summary, rows, trends, settings] = await Promise.all([
    summaryReport(session, month),
    budgetVsActual(session, month),
    spendingTrends(session),
    getOrganizationSettings(session),
  ])
  const warningPercent = Math.round(settings.warningThreshold * 100)

  const hasTrend = trends.some((point) => point.total > 0)
  const hasCategoryData = summary.byCategory.some((row) => row.total > 0)

  const exports = [
    { href: `summary&format=csv&month=${month}`, label: 'Summary CSV' },
    { href: `summary&format=xlsx&month=${month}`, label: 'Summary XLSX' },
    { href: `budget&format=csv&month=${month}`, label: 'Budget vs actual CSV' },
    {
      href: `budget&format=xlsx&month=${month}`,
      label: 'Budget vs actual XLSX',
    },
  ]

  return (
    <div className="space-y-7">
      <PageHeader
        secondary={month}
        title="Reports"
        description={
          session.role === 'admin'
            ? 'Approved spending, budget usage and trends across your organization.'
            : 'Approved spending, budget usage and trends for your department.'
        }
      />

      <Card className="print-hide p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form
            method="get"
            action="/reports"
            className="print-hide flex items-end gap-2"
          >
            <Field id="report-month" label="Month" className="w-44">
              <Input
                id="report-month"
                name="month"
                type="month"
                defaultValue={month}
              />
            </Field>
            <Button type="submit" variant="tinted">
              Apply
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {exports.map((item) => (
              <a
                key={item.label}
                href={`/api/reports/export?report=${item.href}`}
                className="bg-accent-tint text-accent-text text-footnote inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium hover:brightness-[0.97]"
              >
                <Icon icon={ArrowDownToLine} size={14} />
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </Card>

      {monthInvalid && (
        <p className="text-exceeded-text text-footnote">
          That month was not valid, so the report shows {month}.
        </p>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          label={`Total approved — ${month}`}
          value={formatAmount(summary.totalApproved, settings.currency)}
          hint="Approved expenses only."
          icon={<Icon icon={ChartColumn} size={16} />}
        />
        <StatCard
          label={`Awaiting approval — ${month}`}
          value={formatAmount(summary.awaitingApproval, settings.currency)}
          hint="Pending expenses; never counted toward budgets."
          icon={<Icon icon={Clock} size={16} />}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Budget vs actual"
          description={`${month} · below ${warningPercent}% is on track, ${warningPercent}–100% is a warning, above 100% is exceeded. Approved spending in a category without a budget is listed as “No budget”.`}
        />
        <BudgetVsActualTable
          rows={rows}
          currency={settings.currency}
          showDepartment={session.role === 'admin'}
          emptyMessage={`No budgets for ${month} yet.`}
        />
        {rows.length === 0 && session.role === 'manager' && (
          <p className="print-hide text-subheadline">
            <Link
              href="/budgets"
              className="text-accent-text font-medium hover:underline"
            >
              Set budgets for {month}
            </Link>
          </p>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title={`Approved spending breakdown — ${month}`} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BreakdownTable
            caption="Category"
            currency={settings.currency}
            rows={summary.byCategory.map((row) => ({
              name: row.category,
              total: row.total,
            }))}
          />
          <BreakdownTable
            caption="Department"
            currency={settings.currency}
            rows={summary.byDepartment.map((row) => ({
              name: row.name,
              total: row.total,
            }))}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionHeader
            title="Monthly trend"
            description="Approved expenses, last 6 months."
          />
          {hasTrend ? (
            <div className="mt-4">
              <TrendChart points={trends} currency={settings.currency} />
            </div>
          ) : (
            <EmptyState
              icon={<Icon icon={ChartLine} size={20} />}
              title="No approved spending in the last 6 months."
              description="Approved expenses will build this trend line."
            />
          )}
        </Card>

        <Card className="p-5">
          <SectionHeader
            title="Spending by category"
            description={`Approved expenses in ${month}.`}
          />
          {hasCategoryData ? (
            <div className="mt-4">
              <CategoryChart
                data={summary.byCategory}
                currency={settings.currency}
              />
            </div>
          ) : (
            <EmptyState
              icon={<Icon icon={ChartColumn} size={20} />}
              title={`No approved spending in ${month}.`}
              description="Approve a few expenses to see the breakdown."
            />
          )}
        </Card>
      </section>
    </div>
  )
}
