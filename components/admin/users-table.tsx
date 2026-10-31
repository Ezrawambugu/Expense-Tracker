'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { USER_ROLES } from '@/lib/constants'
import { useToast } from '@/components/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { TD, TR, Table, TableContainer, THead, TH } from '@/components/ui/table'
import type {
  AdminDepartmentView,
  AdminUserView,
} from '@/services/admin-service'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
}

const cellSelect = 'h-9 min-w-[7.5rem] text-footnote'

// One table row: role and department are edited in place; status toggles
// with a confirmation. The server re-checks every rule (an admin cannot
// demote or deactivate themselves; the org keeps one active admin).
function UserRow({
  user,
  departments,
  isSelf,
}: {
  user: AdminUserView
  departments: AdminDepartmentView[]
  isSelf: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [role, setRole] = useState(user.role)
  const [departmentId, setDepartmentId] = useState(user.departmentId)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Shown once after a password reset; only ever the plaintext the server
  // returned in this response — it is never stored or re-fetchable.
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  )

  const dirty = role !== user.role || departmentId !== user.departmentId

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, departmentId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Unable to save the user')
        return
      }
      toast('Changes saved')
      router.refresh()
    } catch {
      setError('Unable to save the user. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive() {
    const activating = !user.isActive
    const message = activating
      ? `Reactivate ${user.name}? They will be able to sign in again.`
      : `Deactivate ${user.name}? They will be signed out and cannot sign in.`
    if (!window.confirm(message)) return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: activating }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Unable to change the user status')
        return
      }
      toast(activating ? 'User reactivated' : 'User deactivated')
      router.refresh()
    } catch {
      setError('Unable to change the user status. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function resetPassword() {
    const message = `Reset the password for ${user.name}? A temporary password will be generated and they must change it before signing in.`
    if (!window.confirm(message)) return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Unable to reset the password')
        return
      }
      const data = (await res.json()) as { temporaryPassword: string }
      setTemporaryPassword(data.temporaryPassword)
      toast('Temporary password created')
      router.refresh()
    } catch {
      setError('Unable to reset the password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function copyPassword() {
    if (!temporaryPassword) return
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      toast('Temporary password copied')
    } catch {
      setError('Could not copy — select the password and copy it manually.')
    }
  }

  return (
    <>
      <TR>
        <TD label="Name" className="font-medium">
          {user.name}
          {isSelf && <span className="text-muted ml-1 font-normal">(you)</span>}
        </TD>
        <TD label="Email" className="text-muted">
          {user.email}
        </TD>
        <TD label="Role">
          <label htmlFor={`role-${user.id}`} className="sr-only">
            Role for {user.name}
          </label>
          <Select
            id={`role-${user.id}`}
            value={role}
            disabled={isSelf || busy}
            onChange={(e) => setRole(e.target.value as typeof user.role)}
            className={cellSelect}
          >
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] ?? r}
              </option>
            ))}
          </Select>
        </TD>
        <TD label="Department">
          <label htmlFor={`dept-${user.id}`} className="sr-only">
            Department for {user.name}
          </label>
          <Select
            id={`dept-${user.id}`}
            value={departmentId ?? ''}
            disabled={busy}
            onChange={(e) => setDepartmentId(e.target.value || null)}
            className={cellSelect}
          >
            <option value="">No department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id} disabled={dept.isArchived}>
                {dept.name}
                {dept.isArchived ? ' (archived)' : ''}
              </option>
            ))}
          </Select>
        </TD>
        <TD label="Status">
          <Badge tone={user.isActive ? 'ok' : 'neutral'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </TD>
        <TD label="Actions">
          <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
            <Button
              type="button"
              onClick={save}
              disabled={busy || !dirty}
              size="compact"
            >
              {busy ? 'Saving…' : 'Save'}
            </Button>
            {!isSelf && (
              <>
                <Button
                  type="button"
                  onClick={toggleActive}
                  disabled={busy}
                  variant="destructive"
                  size="compact"
                >
                  {user.isActive ? 'Deactivate' : 'Reactivate'}
                </Button>
                <Button
                  type="button"
                  onClick={resetPassword}
                  disabled={busy}
                  variant="tinted"
                  size="compact"
                >
                  Reset password
                </Button>
              </>
            )}
          </div>
          {error && (
            <p role="alert" className="text-exceeded-text text-footnote mt-1">
              {error}
            </p>
          )}
        </TD>
      </TR>
      {temporaryPassword && (
        <tr className="bg-warning-tint">
          <td colSpan={6} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-subheadline font-medium">
                Temporary password for {user.email}:
              </span>
              <code className="bg-surface-elevated rounded-control text-footnote px-2 py-1 font-mono">
                {temporaryPassword}
              </code>
              <Button
                type="button"
                onClick={copyPassword}
                variant="plain"
                size="compact"
              >
                Copy
              </Button>
              <Button
                type="button"
                onClick={() => setTemporaryPassword(null)}
                variant="plain"
                size="compact"
              >
                Dismiss
              </Button>
            </div>
            <p className="text-footnote text-muted mt-1">
              Give this to the user. They must change it at next sign-in and
              cannot use the app until they do.
            </p>
          </td>
        </tr>
      )}
    </>
  )
}

export function UsersTable({
  users,
  departments,
  currentUserId,
}: {
  users: AdminUserView[]
  departments: AdminDepartmentView[]
  currentUserId: string
}) {
  if (users.length === 0) {
    return (
      <div className="text-muted border-separator rounded-card border border-dashed p-8 text-center">
        No users yet. Create the first one above.
      </div>
    )
  }

  return (
    <TableContainer>
      <Table className="min-w-0 sm:min-w-[46rem]">
        <THead>
          <TR className="hover:bg-transparent">
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Role</TH>
            <TH>Department</TH>
            <TH>Status</TH>
            <TH numeric>
              <span className="sr-only">Actions</span>
            </TH>
          </TR>
        </THead>
        <tbody>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              departments={departments}
              isSelf={user.id === currentUserId}
            />
          ))}
        </tbody>
      </Table>
    </TableContainer>
  )
}
