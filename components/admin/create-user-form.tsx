'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { USER_ROLES } from '@/lib/constants'
import { CreateUserSchema } from '@/schemas/admin'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FormError, Input, Select } from '@/components/ui/field'
import type { AdminDepartmentView } from '@/services/admin-service'

type FieldErrors = Record<string, string[]>

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
}

// Inline "create user" form above the users table.
export function CreateUserForm({
  departments,
}: {
  departments: AdminDepartmentView[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('staff')
  const [departmentId, setDepartmentId] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const parsed = CreateUserSchema.safeParse({
      name,
      email,
      password,
      role,
      departmentId: departmentId === '' ? null : departmentId,
    })
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors as FieldErrors)
      return
    }
    setFieldErrors({})

    setBusy(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const details = data.details?.fieldErrors as FieldErrors | undefined
        if (details) setFieldErrors(details)
        setFormError(data.error ?? 'Unable to create the user')
        return
      }
      toast('User created')
      setName('')
      setEmail('')
      setPassword('')
      setRole('staff')
      setDepartmentId('')
      router.refresh()
    } catch {
      setFormError('Unable to create the user. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <section aria-labelledby="create-user-heading">
        <h2 id="create-user-heading" className="text-headline">
          Create user
        </h2>
        <form onSubmit={handleSubmit} noValidate className="mt-4">
          {formError && (
            <div className="mb-4">
              <FormError message={formError} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="new-user-name"
              label="Name"
              error={fieldErrors.name?.[0]}
            >
              <Input
                id="new-user-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={
                  fieldErrors.name ? 'new-user-name-error' : undefined
                }
              />
            </Field>

            <Field
              id="new-user-email"
              label="Email"
              hint="An email address belongs to one organization only."
              error={fieldErrors.email?.[0]}
            >
              <Input
                id="new-user-email"
                type="email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={
                  fieldErrors.email ? 'new-user-email-error' : undefined
                }
              />
            </Field>

            <Field
              id="new-user-password"
              label="Initial password"
              hint="At least 8 characters. Share it with the user; it is never shown again."
              error={fieldErrors.password?.[0]}
            >
              <Input
                id="new-user-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={
                  fieldErrors.password ? 'new-user-password-error' : undefined
                }
              />
            </Field>

            <Field
              id="new-user-role"
              label="Role"
              error={fieldErrors.role?.[0]}
            >
              <Select
                id="new-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-invalid={!!fieldErrors.role}
                aria-describedby={
                  fieldErrors.role ? 'new-user-role-error' : undefined
                }
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              id="new-user-department"
              label="Department"
              error={fieldErrors.departmentId?.[0]}
            >
              <Select
                id="new-user-department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                aria-invalid={!!fieldErrors.departmentId}
                aria-describedby={
                  fieldErrors.departmentId
                    ? 'new-user-department-error'
                    : undefined
                }
              >
                <option value="">No department</option>
                {departments
                  .filter((dept) => !dept.isArchived)
                  .map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
              </Select>
            </Field>

            <div className="flex items-end">
              <Button type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create user'}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </Card>
  )
}
