'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { DepartmentNameSchema } from '@/schemas/admin'
import { useToast } from '@/components/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { TD, TR, Table, TableContainer, THead, TH } from '@/components/ui/table'
import type { AdminDepartmentView } from '@/services/admin-service'

function referenceSummary(department: AdminDepartmentView): string {
  return [
    `${department.userCount} user${department.userCount === 1 ? '' : 's'}`,
    `${department.budgetCount} budget${department.budgetCount === 1 ? '' : 's'}`,
    `${department.expenseCount} expense${department.expenseCount === 1 ? '' : 's'}`,
  ].join(' · ')
}

function DepartmentRow({ department }: { department: AdminDepartmentView }) {
  const router = useRouter()
  const { toast } = useToast()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(department.name)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function rename(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = DepartmentNameSchema.safeParse({ name })
    if (!parsed.success) {
      setError(
        z.flattenError(parsed.error).fieldErrors.name?.[0] ?? 'Invalid name',
      )
      return
    }

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/departments/${department.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Unable to rename the department')
        return
      }
      toast('Department renamed')
      setRenaming(false)
      router.refresh()
    } catch {
      setError('Unable to rename the department. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function setArchived(archived: boolean) {
    const message = archived
      ? `Archive ${department.name}? Its name stays in historical reports, but it cannot receive new users, budgets or expenses until unarchived.`
      : `Unarchive ${department.name}? It will accept new users, budgets and expenses again.`
    if (!window.confirm(message)) return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/departments/${department.id}/${archived ? 'archive' : 'unarchive'}`,
        { method: 'POST' },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(
          data.error ??
            `Unable to ${archived ? 'archive' : 'unarchive'} the department`,
        )
        return
      }
      toast(archived ? 'Department archived' : 'Department unarchived')
      router.refresh()
    } catch {
      setError(
        `Unable to ${archived ? 'archive' : 'unarchive'} the department. Please try again.`,
      )
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    const references = referenceSummary(department)
    const message =
      department.userCount > 0 ||
      department.budgetCount > 0 ||
      department.expenseCount > 0
        ? `Delete ${department.name} permanently? It still has ${references}, so this will be refused until those records are removed or moved.`
        : `Delete ${department.name} permanently? This cannot be undone.`
    if (!window.confirm(message)) return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/departments/${department.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Unable to delete the department')
        return
      }
      toast('Department deleted')
      router.refresh()
    } catch {
      setError('Unable to delete the department. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (renaming) {
    return (
      <tr className="border-separator border-b">
        <td colSpan={3} className="px-4 py-3">
          <form
            onSubmit={rename}
            noValidate
            className="flex flex-wrap items-center gap-2"
          >
            <label htmlFor={`rename-${department.id}`} className="sr-only">
              New name for {department.name}
            </label>
            <Input
              id={`rename-${department.id}`}
              value={name}
              maxLength={80}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              className="text-footnote h-9 max-w-xs"
            />
            <Button type="submit" disabled={busy} size="compact">
              {busy ? 'Saving…' : 'Save name'}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                setName(department.name)
                setRenaming(false)
                setError(null)
              }}
              variant="plain"
              size="compact"
            >
              Cancel
            </Button>
            {error && (
              <p
                role="alert"
                className="text-exceeded-text text-footnote w-full"
              >
                {error}
              </p>
            )}
          </form>
        </td>
      </tr>
    )
  }

  return (
    <TR>
      <TD label="Department" className="font-medium">
        <span className="inline-flex flex-wrap items-center gap-2">
          {department.name}
          {department.isArchived && <Badge tone="neutral">Archived</Badge>}
        </span>
      </TD>
      <TD label="In use by" className="text-muted tabular-nums">
        {referenceSummary(department)}
      </TD>
      <TD label="Actions">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => setRenaming(true)}
            variant="plain"
            size="compact"
          >
            Rename
          </Button>
          {department.isArchived ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() => setArchived(false)}
              variant="tinted"
              size="compact"
            >
              Unarchive
            </Button>
          ) : (
            <Button
              type="button"
              disabled={busy}
              onClick={() => setArchived(true)}
              variant="tinted"
              size="compact"
            >
              Archive
            </Button>
          )}
          <Button
            type="button"
            disabled={busy}
            onClick={remove}
            variant="destructive"
            size="compact"
          >
            Delete
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-exceeded-text text-footnote mt-1">
            {error}
          </p>
        )}
      </TD>
    </TR>
  )
}

export function DepartmentsTable({
  departments,
}: {
  departments: AdminDepartmentView[]
}) {
  if (departments.length === 0) {
    return (
      <div className="text-muted border-separator rounded-card border border-dashed p-8 text-center">
        No departments yet. Create one above, then assign users to it.
      </div>
    )
  }

  return (
    <TableContainer>
      <Table className="min-w-0 sm:min-w-[35rem]">
        <THead>
          <TR className="hover:bg-transparent">
            <TH>Department</TH>
            <TH>In use by</TH>
            <TH numeric>
              <span className="sr-only">Actions</span>
            </TH>
          </TR>
        </THead>
        <tbody>
          {departments.map((department) => (
            <DepartmentRow key={department.id} department={department} />
          ))}
        </tbody>
      </Table>
    </TableContainer>
  )
}
