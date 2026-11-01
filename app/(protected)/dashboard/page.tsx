import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChartColumn, CircleAlert, Plus, Wallet } from 'lucide-react'
import { getSession } from '@/lib/session'
import { connectDB } from '@/lib/db'
import { User } from '@/models/user'
import {
  budgetAlerts,
  budgetVsActual,
  summaryReport,
} from '@/services/report-service'
import { getOrganizationSettings } from '@/services/organization-service'
import { departmentNames } from '@/services/directory-service'
import { currentMonth, formatAmount, formatPercent } from '@/lib/format'
import {
  BudgetStatusBadge,
  BudgetVsActualTable,
} from '@/components/budget-vs-actual-table'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Icon } from '@/components/ui/icon'
import { LinkButton } from '@/components/ui/button'

// Dashboard content changes by role.
// Reads the session cookie on every request — blocking route (cacheComponents).
export const instant = false

const TONE = {
  ok: 'ok',
  warning: 'warning',
  exceeded: 'exceeded',
  unbudgeted: 'neutral',
} as const

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  await connectDB()
  const user = await User.findOne({
    _id: session.userId,
    organizationId: session.organizationId,
  }).lean()

  const month = currentMonth()
  // Managers get the alert list (Phase 4 output c); staff get a read-only
  // view of their own department's budget status (roles section). Admins get
  // the organization totals from the same report service the reports page uses.
  const [alerts, budgetRows, summary, settings] = await Promise.all([
    session.role === 'manager' ? budgetAlerts(session, month) : [],
    session.role === 'admin' ? [] : budgetVsActual(session, month),
    session.role === 'admin' ? summaryReport(session, month) : null,
    getOrganizationSettings(session),
  ])
  const currency = settings.currency
  const hasExceeded = alerts.some((row) => row.status === 'exceeded')

  const deptNames = session.departmentId
    ? await departmentNames(session, [session.departmentId])
    : {}
  const departmentName = session.departmentId
    ? (deptNames[session.departmentId] ?? '—')
    : 'Not assigned'

  const greeting = user?.name ? `Welcome, ${user.name}` : 'Welcome'

  const blurb: Record<string, string> = {
    admin:
      'You manage users and departments and can see everything in your organization.',
    manager:
      'You set budgets, approve expenses for your department, and view reports.',
    staff:
      'You record your expenses and can view your department’s budget status.',
  }

  // Headline figures come straight from the report service rows, so the
  // dashboard never re-derives a business number.
  const available = budgetRows.reduce(
    (sum, row) => sum + (row.available ?? 0),
    0,
  )
  const spent = budgetRows.reduce((sum, row) => sum + row.spent, 0)
  const remaining = Math.max(0, available - spent)
  const usedRatio = available > 0 ? spent / available : 0
  const overallTone =
    usedRatio > 1
      ? 'exceeded'
      : usedRatio >= settings.warningThreshold
        ? 'warning'
        : 'ok'

  return (
    <div className="space-y-7">
      <PageHeader
        secondary={month}
        title={greeting}
        description={blurb[session.role] ?? 'You are signed in.'}
        actions={
          session.role !== 'admin' ? (
            <LinkButton
              href="/expenses/new"
              variant="filled"
              className="w-full sm:w-auto"
            >
              <Icon icon={Plus} size={16} />
              New expense
            </LinkButton>
          ) : undefined
        }
      />

      {alerts.length > 0 && (
        <section
          aria-label="Budget alerts"
          className="glass rounded-card overflow-hidden"
        >
          <div
            className={`p-5 sm:p-6 ${
              hasExceeded ? 'bg-exceeded-tint/70' : 'bg-warning-tint/70'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  hasExceeded
                    ? 'bg-exceeded-tint text-exceeded-text'
                    : 'bg-warning-tint text-warning-text'
                }`}
              >
                <Icon icon={CircleAlert} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-headline">
                  {alerts.length === 1
                    ? '1 category needs attention in '
                    : `${alerts.length} categories need attention in `}
                  {month}.
                </h2>
                <p className="text-footnote text-muted mt-0.5">
                  Approved spending is at or past your warning line.
                </p>

                <ul className="mt-4 max-w-3xl space-y-3.5">
                  {alerts.map((row) => (
                    <li key={`${row.departmentId}-${row.category}`}>
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <div className="flex items-center gap-2">
                          <BudgetStatusBadge status={row.status} />
                          <span className="text-subheadline font-medium">
                            {row.category}
                          </span>
                        </div>
                        <span className="text-footnote text-muted tabular-nums">
                          {row.percentUsed === null
                            ? `${formatAmount(row.spent, currency)} spent with no budget`
                            : `${formatPercent(row.percentUsed)} used (${formatAmount(row.spent, currency)} of ${formatAmount(row.available ?? 0, currency)})`}
                        </span>
                      </div>
                      {row.percentUsed !== null && (
                        <div className="mt-2 max-w-md">
                          <Progress
                            ratio={row.percentUsed}
                            tone={TONE[row.status]}
                            label={`${row.category} budget used`}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <p className="text-subheadline mt-4 flex flex-wrap items-center gap-3 font-medium">
                  <Link
                    href="/budgets"
                    className="text-accent-text hover:underline"
                  >
                    Adjust budgets
                  </Link>
                  <span aria-hidden="true" className="text-muted">
                    ·
                  </span>
                  <Link
                    href="/reports"
                    className="text-accent-text hover:underline"
                  >
                    View reports
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {session.role === 'admin' && summary && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            label={`Total approved — ${month}`}
            value={formatAmount(summary.totalApproved, currency)}
            hint="Approved expenses across the organization."
            icon={<Icon icon={ChartColumn} size={16} />}
          />
          <StatCard
            label={`Awaiting approval — ${month}`}
            value={formatAmount(summary.awaitingApproval, currency)}
            hint="Pending expenses; never counted toward budgets."
            icon={<Icon icon={Wallet} size={16} />}
          />
        </section>
      )}

      {session.role !== 'admin' && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label={`Available — ${month}`}
            value={formatAmount(available, currency)}
            hint="Budget plus any carried-over amount."
            tone={overallTone}
            ratio={usedRatio}
          />
          <StatCard
            label="Spent"
            value={formatAmount(spent, currency)}
            hint={`${formatPercent(usedRatio)} of the available budget.`}
            tone={overallTone}
          />
          <StatCard
            label="Remaining"
            value={formatAmount(remaining, currency)}
            hint="Approved spending only counts against a budget."
            tone={overallTone}
          />
        </section>
      )}

      {session.role === 'staff' && (
        <section className="space-y-3">
          <SectionHeader
            title={`Department budget status — ${month}`}
            description="Read-only. Only approved expenses count; pending ones show as awaiting approval."
          />
          <BudgetVsActualTable
            rows={budgetRows}
            currency={currency}
            emptyMessage={`No budgets for ${month} yet.`}
          />
        </section>
      )}

      <Card className="p-5">
        <h2 className="text-headline">Your access</h2>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-footnote text-muted">Role</dt>
            <dd className="text-subheadline mt-0.5 font-medium capitalize">
              {session.role}
            </dd>
          </div>
          <div>
            <dt className="text-footnote text-muted">Organization</dt>
            <dd className="text-subheadline mt-0.5 font-medium">
              {settings.name}
            </dd>
          </div>
          <div>
            <dt className="text-footnote text-muted">Department</dt>
            <dd className="text-subheadline mt-0.5 font-medium">
              {departmentName}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
