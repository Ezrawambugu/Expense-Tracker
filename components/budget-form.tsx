'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { CATEGORIES } from '@/lib/constants'
import { currentMonth } from '@/lib/format'
import { CreateBudgetSchema, UpdateBudgetSchema } from '@/schemas/budget'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FormError,
  Input,
  Select,
} from '@/components/ui/field'

type FieldErrors = Record<string, string[]>

export type BudgetFormInitial = {
  category: string
  amount: string
  month: string
  carryOver: boolean
}

export function BudgetForm({
  mode,
  budgetId,
  initial,
  idPrefix = 'budget',
}: {
  mode: 'create' | 'edit'
  budgetId?: string
  initial?: Partial<BudgetFormInitial>
  // The budgets page renders a filter form with the same field names, so the
  // inputs need unique ids.
  idPrefix?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [month, setMonth] = useState(initial?.month ?? currentMonth())
  const [category, setCategory] = useState(initial?.category ?? 'Transport')
  const [amount, setAmount] = useState(initial?.amount ?? '')
  const [carryOver, setCarryOver] = useState(initial?.carryOver ?? false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const payload = {
      category,
      amount: amount === '' ? amount : Number(amount),
      month,
      carryOver,
    }

    // Client-side validation mirrors the server's shared schema.
    const schema = mode === 'create' ? CreateBudgetSchema : UpdateBudgetSchema
    const parsed = schema.safeParse(payload)
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors as FieldErrors)
      return
    }
    setFieldErrors({})

    setBusy(true)
    try {
      const res = await fetch(
        mode === 'create' ? '/api/budgets' : `/api/budgets/${budgetId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const details = data.details?.fieldErrors as FieldErrors | undefined
        if (details) setFieldErrors(details)
        setFormError(data.error ?? 'Unable to save the budget')
        return
      }

      toast(mode === 'create' ? 'Budget created' : 'Changes saved')
      router.push('/budgets')
      router.refresh()
    } catch {
      setFormError('Unable to save the budget. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const carryOverId = `${idPrefix}-carryover`

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-lg space-y-5">
      {formError && <FormError message={formError} />}

      <Field
        id={`${idPrefix}-month`}
        label="Month"
        error={fieldErrors.month?.[0]}
      >
        <Input
          id={`${idPrefix}-month`}
          type="month"
          required
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-invalid={!!fieldErrors.month}
          aria-describedby={
            fieldErrors.month ? `${idPrefix}-month-error` : undefined
          }
        />
      </Field>

      <Field
        id={`${idPrefix}-category`}
        label="Category"
        error={fieldErrors.category?.[0]}
      >
        <Select
          id={`${idPrefix}-category`}
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-invalid={!!fieldErrors.category}
          aria-describedby={
            fieldErrors.category ? `${idPrefix}-category-error` : undefined
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        id={`${idPrefix}-amount`}
        label="Budget amount"
        error={fieldErrors.amount?.[0]}
      >
        <Input
          id={`${idPrefix}-amount`}
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={!!fieldErrors.amount}
          aria-describedby={
            fieldErrors.amount ? `${idPrefix}-amount-error` : undefined
          }
          className="tabular-nums"
        />
      </Field>

      <div className="bg-surface-elevated border-separator rounded-control flex items-start gap-3 border p-3">
        <input
          id={carryOverId}
          type="checkbox"
          checked={carryOver}
          onChange={(e) => setCarryOver(e.target.checked)}
          className="accent-accent-fill mt-0.5 h-4 w-4"
        />
        <div>
          <label htmlFor={carryOverId} className="text-subheadline font-medium">
            Carry over unspent budget
          </label>
          <p className="text-footnote text-muted">
            Adds the previous month’s unspent amount for this category to this
            month’s available budget.
          </p>
          {fieldErrors.carryOver?.[0] && (
            <FieldError
              id={`${carryOverId}-error`}
              message={fieldErrors.carryOver[0]}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : mode === 'create' ? 'Set budget' : 'Save changes'}
        </Button>
        <Link
          href="/budgets"
          className="text-accent-text text-subheadline font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
