'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { CATEGORIES } from '@/lib/constants'
import { todayDateOnly } from '@/lib/format'
import { CreateExpenseSchema, UpdateExpenseSchema } from '@/schemas/expense'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import {
  Field,
  FormError,
  Input,
  Select,
  Textarea,
} from '@/components/ui/field'

type FieldErrors = Record<string, string[]>

export type ExpenseFormInitial = {
  category: string
  amount: string
  date: string
  description: string
}

export function ExpenseForm({
  mode,
  expenseId,
  initial,
}: {
  mode: 'create' | 'edit'
  expenseId?: string
  initial?: ExpenseFormInitial
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [category, setCategory] = useState(initial?.category ?? 'Transport')
  const [amount, setAmount] = useState(initial?.amount ?? '')
  const [date, setDate] = useState(initial?.date ?? todayDateOnly())
  const [description, setDescription] = useState(initial?.description ?? '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const payload = {
      category,
      amount: amount === '' ? amount : Number(amount),
      date,
      description,
    }

    // Client-side validation mirrors the server's shared schema.
    const schema = mode === 'create' ? CreateExpenseSchema : UpdateExpenseSchema
    const parsed = schema.safeParse(payload)
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors as FieldErrors)
      return
    }
    setFieldErrors({})

    setBusy(true)
    try {
      // The schema turns `date` into a Date; the API expects `YYYY-MM-DD`, so
      // send the raw input value rather than the normalized one.
      const res = await fetch(
        mode === 'create' ? '/api/expenses' : `/api/expenses/${expenseId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...parsed.data, date }),
        },
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const details = data.details?.fieldErrors as FieldErrors | undefined
        if (details) setFieldErrors(details)
        setFormError(data.error ?? 'Unable to save the expense')
        return
      }

      toast(mode === 'create' ? 'Expense created' : 'Changes saved')
      router.push('/expenses')
      router.refresh()
    } catch {
      setFormError('Unable to save the expense. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-lg space-y-5">
      {formError && <FormError message={formError} />}

      <Field id="category" label="Category" error={fieldErrors.category?.[0]}>
        <Select
          id="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-invalid={!!fieldErrors.category}
          aria-describedby={fieldErrors.category ? 'category-error' : undefined}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="amount" label="Amount" error={fieldErrors.amount?.[0]}>
        <Input
          id="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={!!fieldErrors.amount}
          aria-describedby={fieldErrors.amount ? 'amount-error' : undefined}
          className="tabular-nums"
        />
      </Field>

      <Field id="date" label="Date" error={fieldErrors.date?.[0]}>
        <Input
          id="date"
          type="date"
          required
          max={todayDateOnly()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={!!fieldErrors.date}
          aria-describedby={fieldErrors.date ? 'date-error' : undefined}
        />
      </Field>

      <Field
        id="description"
        label="Description"
        optional
        hint={`${description.length}/200 characters`}
        error={fieldErrors.description?.[0]}
      >
        <Textarea
          id="description"
          rows={3}
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={!!fieldErrors.description}
          aria-describedby={
            fieldErrors.description ? 'description-error' : undefined
          }
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={busy}>
          {busy
            ? 'Saving…'
            : mode === 'create'
              ? 'Create expense'
              : 'Save changes'}
        </Button>
        <Link
          href="/expenses"
          className="text-accent-text text-subheadline font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
