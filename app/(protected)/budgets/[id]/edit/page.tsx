import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { getBudget } from '@/services/budget-service'
import { BudgetForm } from '@/components/budget-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'

export const instant = false

export default async function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  // Only managers change budgets; admins are read-only.
  if (session.role !== 'manager') redirect('/budgets')

  const { id } = await params
  const budget = await getBudget(session, id)
  if (!budget) notFound()

  return (
    <div className="mx-auto max-w-xl space-y-7">
      <PageHeader
        title="Edit budget"
        description={`${budget.category} · ${budget.month}`}
      />

      <Card className="p-5 sm:p-6">
        <BudgetForm
          mode="edit"
          budgetId={budget.id}
          initial={{
            month: budget.month,
            category: budget.category,
            amount: String(budget.amount),
            carryOver: budget.carryOver,
          }}
        />
      </Card>

      <p className="text-subheadline">
        <Link
          href="/budgets"
          className="text-accent-text font-medium hover:underline"
        >
          Back to budgets
        </Link>
      </p>
    </div>
  )
}
