'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleAlert } from 'lucide-react'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export function DeleteBudgetButton({ budgetId }: { budgetId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!window.confirm('Delete this budget? This cannot be undone.')) return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/budgets/${budgetId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Unable to delete the budget')
        return
      }
      toast('Budget deleted')
      router.refresh()
    } catch {
      setError('Unable to delete the budget. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <Button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        variant="destructive"
        size="compact"
      >
        {busy ? 'Deleting…' : 'Delete'}
      </Button>
      {error && (
        <span className="text-exceeded-text text-footnote mt-1 inline-flex items-center gap-1">
          <Icon icon={CircleAlert} size={12} />
          {error}
        </span>
      )}
    </span>
  )
}
