'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChangePasswordSchema } from '@/schemas/auth'
import { Button } from '@/components/ui/button'
import { Field, FormError, Input } from '@/components/ui/field'

type FieldErrors = Record<string, string[]>

// Shared by /account (voluntary) and /account/change-password (forced by an
// admin-set temporary password). Posts to /api/account/password, which
// requires the current password and clears the mustChangePassword flag.
export function ChangePasswordForm() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    // Client-side validation with the shared schema.
    const parsed = ChangePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors)
      return
    }
    setFieldErrors({})

    setBusy(true)
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFormError(data.error ?? 'Unable to change your password')
        return
      }
      // replace() so the back button doesn't return to the change form.
      router.replace('/dashboard')
      router.refresh()
    } catch {
      setFormError('Unable to change your password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <FormError message={formError} />}

      <Field
        id="currentPassword"
        label="Current password"
        error={fieldErrors.currentPassword?.[0]}
      >
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          aria-invalid={!!fieldErrors.currentPassword}
          aria-describedby={
            fieldErrors.currentPassword ? 'currentPassword-error' : undefined
          }
        />
      </Field>

      <Field
        id="newPassword"
        label="New password"
        hint="At least 8 characters."
        error={fieldErrors.newPassword?.[0]}
      >
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          aria-invalid={!!fieldErrors.newPassword}
          aria-describedby={
            fieldErrors.newPassword ? 'newPassword-error' : undefined
          }
        />
      </Field>

      <Field
        id="confirmPassword"
        label="Confirm new password"
        error={fieldErrors.confirmPassword?.[0]}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={!!fieldErrors.confirmPassword}
          aria-describedby={
            fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined
          }
        />
      </Field>

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Changing…' : 'Change password'}
      </Button>
    </form>
  )
}
