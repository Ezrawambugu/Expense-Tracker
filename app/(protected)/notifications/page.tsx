import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { getSession } from '@/lib/session'
import { listNotifications } from '@/services/notification-service'
import { NotificationQuerySchema } from '@/schemas/notification'
import { NotificationIcon } from '@/components/notification-icon'
import type { NotificationType } from '@/lib/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/button'
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

const STATUS_LABELS: Record<NotificationType, string> = {
  expense_approved: 'Expense approved',
  expense_rejected: 'Expense rejected',
  expense_pending: 'Expense pending review',
  budget_warning: 'Budget warning',
  budget_exceeded: 'Budget exceeded',
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const raw = await searchParams
  const query = NotificationQuerySchema.safeParse({
    page: parseInt(raw.page ?? '1', 10),
    pageSize: parseInt(raw.pageSize ?? '20', 10),
  })

  if (!query.success) {
    redirect('/notifications?page=1&pageSize=20')
  }

  const result = await listNotifications(session, query.data)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="In-app notices for approvals, rejections, pending expenses and budget alerts. Read-only for other users."
      />

      <TableContainer>
        <Table className="min-w-0 sm:min-w-[40rem]">
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Type</TH>
              <TH>Message</TH>
              <TH>When</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            {result.items.length === 0 ? (
              <TableEmpty
                colSpan={4}
                icon={<Icon icon={Bell} size={20} />}
                title="No notifications."
                description="Approvals, rejections and budget alerts land here."
              />
            ) : (
              result.items.map((item) => (
                <TR key={item.id}>
                  <TD label="Type">
                    <div className="text-foreground flex items-center gap-2">
                      <NotificationIcon name={item.type} />
                      <span className="text-subheadline font-medium">
                        {STATUS_LABELS[item.type] ?? item.type}
                      </span>
                    </div>
                  </TD>
                  <TD label="Message" className="text-muted">
                    {item.message}
                  </TD>
                  <TD label="When" className="text-muted whitespace-nowrap">
                    {formatCreatedAt(item.createdAt)}
                  </TD>
                  <TD label="Status">
                    {item.readAt === null ? (
                      <Badge tone="info">Unread</Badge>
                    ) : (
                      <Badge tone="neutral">Read</Badge>
                    )}
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      <div className="text-footnote text-muted flex flex-wrap items-center justify-between gap-3">
        <p className="tabular-nums">
          {result.total} notification{result.total === 1 ? '' : 's'} · page{' '}
          {result.page} of {result.totalPages}
        </p>
        <div className="flex items-center gap-2">
          {result.page > 1 && (
            <LinkButton
              href={`/notifications?page=${result.page - 1}&pageSize=${result.pageSize}`}
              variant="tinted"
              size="compact"
            >
              Previous
            </LinkButton>
          )}
          {result.page < result.totalPages && (
            <LinkButton
              href={`/notifications?page=${result.page + 1}&pageSize=${result.pageSize}`}
              variant="tinted"
              size="compact"
            >
              Next
            </LinkButton>
          )}
        </div>
      </div>

      <Link
        href="/dashboard"
        className="text-accent-text text-subheadline inline-block font-medium hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
