'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { DepartmentNameSchema } from '@/schemas/admin'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FormError, Input } from '@/components/ui/field'

type FieldErrors = Record<string, string[]>

// Inline "create department" form above the departments table.
export function DepartmentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const parsed = DepartmentNameSchema.safeParse({ name })
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors as FieldErrors)
      return
    }
    setFieldErrors({})

    setBusy(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const details = data.details?.fieldErrors as FieldErrors | undefined
        if (details) setFieldErrors(details)
        setFormError(data.error ?? 'Unable to create the department')
        return
      }
      toast('Department created')
      setName('')
      router.refresh()
    } catch {
      setFormError('Unable to create the department. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <section aria-labelledby="create-department-heading">
        <h2 id="create-department-heading" className="text-headline">
          Create department
        </h2>
        <form onSubmit={handleSubmit} noValidate className="mt-4">
          {formError && (
            <div className="mb-4">
              <FormError message={formError} />
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <Field
              id="new-dept-name"
              label="Department name"
              error={fieldErrors.name?.[0]}
              className="w-full max-w-xs"
            >
              <Input
                id="new-dept-name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={
                  fieldErrors.name ? 'new-dept-name-error' : undefined
                }
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create department'}
            </Button>
          </div>
        </form>
      </section>
    </Card>
  )
}
