'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleAlert } from 'lucide-react'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import { Label, Textarea } from '@/components/ui/field'
import { Icon } from '@/components/ui/icon'

// Approve or reject a pending expense. Rejecting reveals an optional reason,
// which the API stores on the expense so staff can see why it was rejected.
export function ReviewExpenseActions({ expenseId }: { expenseId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function review(action: 'approve' | 'reject') {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/expenses/${expenseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'reject' ? { action, reason } : { action },
        ),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Unable to review the expense')
        return
      }
      setRejecting(false)
      setReason('')
      toast(action === 'approve' ? 'Expense approved' : 'Expense rejected')
      router.refresh()
    } catch {
      setError('Unable to review the expense. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {rejecting ? (
        <div className="w-56 space-y-2">
          <Label htmlFor={`reason-${expenseId}`} optional>
            Reason
          </Label>
          <Textarea
            id={`reason-${expenseId}`}
            rows={2}
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-0 py-2"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => review('reject')}
              variant="destructive"
              size="compact"
            >
              {busy ? 'Saving…' : 'Confirm reject'}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => setRejecting(false)}
              variant="plain"
              size="compact"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => review('approve')}
            variant="success"
            size="compact"
          >
            {busy ? 'Saving…' : 'Approve'}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => setRejecting(true)}
            variant="destructive"
            size="compact"
          >
            Reject
          </Button>
        </div>
      )}
      {error && (
        <span className="text-exceeded-text text-footnote inline-flex items-center gap-1">
          <Icon icon={CircleAlert} size={12} />
          {error}
        </span>
      )}
    </div>
  )
}
