import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ScrollText } from 'lucide-react'
import { getSession } from '@/lib/session'
import { listAuditLogs } from '@/services/audit-service'
import { listUsers } from '@/services/admin-service'
import { AuditQuerySchema } from '@/schemas/audit'
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/constants'
import { PageHeader } from '@/components/ui/page-header'
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

const ACTION_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  approve: 'Approved',
  reject: 'Rejected',
}

// UTC timestamp without seconds — the audit page is server-rendered, so this
// does not need to match a browser locale.
function formatTimestamp(iso: string): string {
  return `${iso.slice(0, 16).replace('T', ' ')} UTC`
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/dashboard')

  const raw = await searchParams
  const rawQuery: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const v = first(value)
    if (v) rawQuery[key] = v
  }

  // Invalid filters fall back to the unfiltered first page instead of erroring.
  const parsed = AuditQuerySchema.safeParse(rawQuery)
  const query = parsed.success ? parsed.data : AuditQuerySchema.parse({})
  const filtersInvalid = !parsed.success && Object.keys(rawQuery).length > 0

  const [result, users] = await Promise.all([
    listAuditLogs(session, query),
    listUsers(session),
  ])

  // Preserve the active filters when paging.
  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    if (query.userId) params.set('userId', query.userId)
    if (query.entity) params.set('entity', query.entity)
    if (query.action) params.set('action', query.action)
    if (query.from) params.set('from', query.from.toISOString().slice(0, 10))
    if (query.to) params.set('to', query.to.toISOString().slice(0, 10))
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    return qs ? `/admin/audit?${qs}` : '/admin/audit'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Every create, update, delete, approve and reject in your organization. Read-only, newest first."
      />

      <Card className="p-4">
        <form
          method="get"
          action="/admin/audit"
          className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          <Field id="audit-user" label="User" className="lg:col-span-2">
            <Select
              id="audit-user"
              name="userId"
              defaultValue={query.userId ?? ''}
            >
              <option value="">Anyone</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="audit-entity" label="Entity">
            <Select
              id="audit-entity"
              name="entity"
              defaultValue={query.entity ?? ''}
            >
              <option value="">Any entity</option>
              {AUDIT_ENTITIES.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="audit-action" label="Action">
            <Select
              id="audit-action"
              name="action"
              defaultValue={query.action ?? ''}
            >
              <option value="">Any action</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {ACTION_LABELS[action] ?? action}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="audit-from" label="From">
            <Input
              id="audit-from"
              name="from"
              type="date"
              defaultValue={
                query.from ? query.from.toISOString().slice(0, 10) : ''
              }
            />
          </Field>

          <Field id="audit-to" label="To">
            <Input
              id="audit-to"
              name="to"
              type="date"
              defaultValue={query.to ? query.to.toISOString().slice(0, 10) : ''}
            />
          </Field>

          <div className="flex items-center gap-2 lg:col-span-6">
            <Button type="submit" variant="tinted">
              Apply filters
            </Button>
            <Link
              href="/admin/audit"
              className="text-subheadline text-muted hover:text-foreground px-2 font-medium"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      {filtersInvalid && (
        <p className="text-exceeded-text text-footnote">
          Some filters were invalid, so the log shows the newest entries.
        </p>
      )}

      <TableContainer>
        <Table className="min-w-0 sm:min-w-[48rem]">
          <THead>
            <TR className="hover:bg-transparent">
              <TH>When</TH>
              <TH>User</TH>
              <TH>Action</TH>
              <TH>Entity</TH>
              <TH>Record</TH>
            </TR>
          </THead>
          <tbody>
            {result.items.length === 0 ? (
              <TableEmpty
                colSpan={5}
                icon={<Icon icon={ScrollText} size={20} />}
                title="No audit entries match these filters."
                description="Every write in the organization is recorded here."
              />
            ) : (
              result.items.map((entry) => (
                <TR key={entry.id}>
                  <TD
                    label="When"
                    className="text-muted whitespace-nowrap tabular-nums"
                  >
                    <span title={entry.createdAt}>
                      {formatTimestamp(entry.createdAt)}
                    </span>
                  </TD>
                  <TD label="User">
                    {entry.userName ?? (
                      <span className="text-muted">
                        Unknown user ({entry.userId})
                      </span>
                    )}
                  </TD>
                  <TD label="Action">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </TD>
                  <TD label="Entity">{entry.entity}</TD>
                  <TD label="Record" className="text-muted font-mono text-xs">
                    {entry.entityId}
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      <div className="text-footnote text-muted flex flex-wrap items-center justify-between gap-3">
        <p className="tabular-nums">
          {result.total} entr{result.total === 1 ? 'y' : 'ies'} · page{' '}
          {result.page} of {result.totalPages}
        </p>
        <div className="flex items-center gap-2">
          {result.page > 1 && (
            <LinkButton
              href={buildUrl(result.page - 1)}
              variant="glass"
              size="compact"
            >
              Previous
            </LinkButton>
          )}
          {result.page < result.totalPages && (
            <LinkButton
              href={buildUrl(result.page + 1)}
              variant="glass"
              size="compact"
            >
              Next
            </LinkButton>
          )}
        </div>
      </div>
    </div>
  )
}
