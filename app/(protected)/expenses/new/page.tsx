import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { ExpenseForm } from '@/components/expense-form'

export const instant = false

export default async function NewExpensePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Only staff record expenses in this phase.
  if (session.role !== 'staff') redirect('/expenses')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New expense</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Recorded as pending until a manager reviews it.
        </p>
      </div>

      <ExpenseForm mode="create" />

      <p className="text-sm">
        <Link href="/expenses" className="underline">
          Back to expenses
        </Link>
      </p>
    </div>
  )
}
