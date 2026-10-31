'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoginSchema } from '@/schemas/auth'
import { Button } from '@/components/ui/button'
import { Field, FormError, Input } from '@/components/ui/field'

type FieldErrors = Record<string, string[]>

// useSearchParams needs a Suspense boundary while the page is prerendered.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

const REASON_MESSAGES: Record<string, string> = {
  deactivated:
    'Your account has been deactivated. Contact an administrator to regain access.',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reasonMessage =
    REASON_MESSAGES[searchParams.get('reason') ?? ''] ?? null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    // Client-side validation with the shared schema.
    const parsed = LoginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors)
      return
    }
    setFieldErrors({})

    setBusy(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFormError(data.error ?? 'Unable to sign in')
        return
      }
      const data = await res.json().catch(() => ({}))
      // An admin-set temporary password must be changed before anything else
      // (Phase 7A); the protected layout enforces it too.
      const target = data.user?.mustChangePassword
        ? '/account/change-password'
        : '/dashboard'
      // replace() so the back button doesn't return to the login form. The
      // dashboard is dynamic and refetched on navigation, so no refresh().
      router.replace(target)
    } catch {
      setFormError('Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="animate-rise-in w-full max-w-[26rem]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="bg-accent-fill text-on-accent shadow-floating grid h-12 w-12 place-items-center rounded-[14px]">
            <span className="text-headline font-bold">ET</span>
          </span>
          <div>
            <p className="text-caption text-muted font-semibold tracking-widest uppercase">
              Management Information System
            </p>
          </div>
        </div>

        <div className="glass shadow-floating rounded-sheet p-7 sm:p-8">
          <h1 className="text-title text-foreground text-center">Sign in</h1>
          <p className="text-subheadline text-muted mt-1 text-center">
            Expense Tracker for your organization
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {reasonMessage && (
              <p
                role="status"
                className="bg-warning-tint text-warning-text text-subheadline rounded-control p-3"
              >
                {reasonMessage}
              </p>
            )}
            {formError && <FormError message={formError} />}

            <Field id="email" label="Email" error={fieldErrors.email?.[0]}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
            </Field>

            <Field
              id="password"
              label="Password"
              error={fieldErrors.password?.[0]}
            >
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
              />
            </Field>

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-subheadline text-muted mt-6 text-center">
          No account yet?{' '}
          <Link
            href="/register"
            className="text-accent-text font-medium hover:underline"
          >
            Create an organization
          </Link>
        </p>
      </div>
    </main>
  )
}
