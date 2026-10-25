import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/guard'
import { errorResponse } from '@/lib/api-error'
import { ReviewExpenseSchema } from '@/schemas/expense'
import { reviewExpense } from '@/services/expense-service'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/expenses/:id/review — approve or reject a pending expense.
// Managers only, and only within their own department (master prompt Phase 3).
export async function POST(req: NextRequest, ctx: RouteContext) {
  const guard = await requireRole('manager')
  if (!guard.ok) return guard.response

  const { id } = await ctx.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = ReviewExpenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: z.flattenError(parsed.error) },
      { status: 400 },
    )
  }

  try {
    const expense = await reviewExpense(guard.session, id, parsed.data)
    return NextResponse.json({ expense })
  } catch (err) {
    return errorResponse(err)
  }
}
