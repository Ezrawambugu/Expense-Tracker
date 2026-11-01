'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast'
import { currentMonth, previousMonth } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { FormError, Input, Label } from '@/components/ui/field'

// Phase 7C: copy a whole month of budgets into another month. Existing
// categories in the target month are skipped, never overwritten.
export function CopyBudgetsForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [fromMonth, setFromMonth] = useState(previousMonth(currentMonth()))
  const [toMonth, setToMonth] = useState(currentMonth())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/budgets/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromMonth, toMonth }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Unable to copy the budgets')
        return
      }

      const data = (await res.json()) as { created: number; skipped: number }
      toast(
        `Copied ${data.created} budget${data.created === 1 ? '' : 's'} to ${toMonth}` +
          (data.skipped ? `, skipped ${data.skipped} existing` : ''),
      )
      router.refresh()
    } catch {
      setError('Unable to copy the budgets. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <FormError message={error} />}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="copy-from-month">Copy from</Label>
          <Input
            id="copy-from-month"
            type="month"
            required
            value={fromMonth}
            onChange={(e) => setFromMonth(e.target.value)}
            className="text-footnote mt-1.5 h-9 w-auto"
          />
        </div>
        <div>
          <Label htmlFor="copy-to-month">To</Label>
          <Input
            id="copy-to-month"
            type="month"
            required
            value={toMonth}
            onChange={(e) => setToMonth(e.target.value)}
            className="text-footnote mt-1.5 h-9 w-auto"
          />
        </div>
        <Button type="submit" disabled={busy} variant="tinted" size="compact">
          {busy ? 'Copying…' : 'Copy budgets'}
        </Button>
      </div>
      <p className="text-footnote text-muted">
        Categories that already have a budget in the target month are skipped.
      </p>
    </form>
  )
}
