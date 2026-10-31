'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RegisterSchema } from '@/schemas/auth'
import { Button } from '@/components/ui/button'
import { Field, FormError, Input } from '@/components/ui/field'

type FieldErrors = Record<string, string[]>

export default function RegisterPage() {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const parsed = RegisterSchema.safeParse({
      organizationName,
      name,
      email,
      password,
    })
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors)
      return
    }
    setFieldErrors({})

    setBusy(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFormError(data.error ?? 'Could not create account')
        return
      }
      // Same as login: replace the auth page in history and let the dynamic
      // dashboard refetch on navigation.
      router.replace('/dashboard')
    } catch {
      setFormError('Could not create account. Please try again.')
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
          <p className="text-caption text-muted font-semibold tracking-widest uppercase">
            Management Information System
          </p>
        </div>

        <div className="glass shadow-floating rounded-sheet p-7 sm:p-8">
          <h1 className="text-title text-foreground text-center">
            Create an organization
          </h1>
          <p className="text-subheadline text-muted mt-1 text-center">
            You&apos;ll be the first admin user.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {formError && <FormError message={formError} />}

            <Field
              id="organizationName"
              label="Organization name"
              error={fieldErrors.organizationName?.[0]}
            >
              <Input
                id="organizationName"
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                aria-invalid={!!fieldErrors.organizationName}
                aria-describedby={
                  fieldErrors.organizationName
                    ? 'organizationName-error'
                    : undefined
                }
              />
            </Field>

            <Field id="name" label="Your name" error={fieldErrors.name?.[0]}>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              />
            </Field>

            <Field
              id="email"
              label="Email"
              hint="An email address belongs to one organization only."
              error={fieldErrors.email?.[0]}
            >
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
                autoComplete="new-password"
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
              {busy ? 'Creating…' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="text-subheadline text-muted mt-6 text-center">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-accent-text font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
