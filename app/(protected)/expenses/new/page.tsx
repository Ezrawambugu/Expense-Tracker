import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { ExpenseForm } from '@/components/expense-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'

export const instant = false

export default async function NewExpensePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Staff and managers record expenses (managers' go to an admin to review).
  if (session.role === 'admin') redirect('/expenses')

  return (
    <div className="mx-auto max-w-xl space-y-7">
      <PageHeader
        title="New expense"
        description={
          session.role === 'manager'
            ? 'Recorded as pending until an admin reviews it.'
            : 'Recorded as pending until a manager reviews it.'
        }
      />

      <Card className="p-5 sm:p-6">
        <ExpenseForm mode="create" />
      </Card>

      <p className="text-subheadline">
        <Link
          href="/expenses"
          className="text-accent-text font-medium hover:underline"
        >
          Back to expenses
        </Link>
      </p>
    </div>
  )
}
