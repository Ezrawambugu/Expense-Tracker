// Expense business logic: scoping, CRUD and audit entries.
//
// Everything here starts from the verified session (rule 2): organization,
// owner and department are never taken from the request body.

import mongoose from 'mongoose'
import type { FilterQuery } from 'mongoose'
import { connectDB } from '@/lib/db'
import { httpError } from '@/lib/api-error'
import type { Session } from '@/lib/auth'
import { expenseScope, reviewScope } from '@/services/expense-scope'
import { recordAudit } from '@/services/audit-service'
import { Expense, type IExpense } from '@/models/expense'
import type {
  CreateExpenseInput,
  ExpenseListQuery,
  ReviewExpenseInput,
  UpdateExpenseInput,
} from '@/schemas/expense'

export type ExpenseView = {
  id: string
  organizationId: string
  departmentId: string | null
  userId: string
  category: IExpense['category']
  amount: number
  date: string
  description: string
  status: IExpense['status']
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
}

export type ExpenseListResult = {
  items: ExpenseView[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function toView(doc: IExpense): ExpenseView {
  return {
    id: String(doc._id),
    organizationId: String(doc.organizationId),
    departmentId: doc.departmentId ? String(doc.departmentId) : null,
    userId: String(doc.userId),
    category: doc.category,
    amount: doc.amount,
    date: doc.date.toISOString(),
    description: doc.description,
    status: doc.status,
    reviewedBy: doc.reviewedBy ? String(doc.reviewedBy) : null,
    reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
    reviewNote: doc.reviewNote ?? null,
    createdAt: doc.createdAt.toISOString(),
  }
}

export async function listExpenses(
  session: Session,
  query: ExpenseListQuery,
): Promise<ExpenseListResult> {
  await connectDB()

  const filter: FilterQuery<IExpense> = {
    organizationId: session.organizationId,
    ...expenseScope(session),
  }

  if (query.category) filter.category = query.category
  if (query.status) filter.status = query.status

  if (query.from || query.to) {
    const dateFilter: { $gte?: Date; $lte?: Date } = {}
    if (query.from) dateFilter.$gte = query.from
    // Inclusive end date: cover the whole `to` day.
    if (query.to) dateFilter.$lte = new Date(query.to.getTime() + DAY_MS - 1)
    filter.date = dateFilter
  }

  const direction = query.sortDir === 'asc' ? 1 : -1
  // `_id` breaks ties so pagination is stable.
  const sort: Record<string, 1 | -1> = {
    [query.sortBy]: direction,
    _id: direction,
  }

  const total = await Expense.countDocuments(filter)
  const docs = await Expense.find(filter)
    .sort(sort)
    .skip((query.page - 1) * query.pageSize)
    .limit(query.pageSize)
    .lean<IExpense[]>()

  return {
    items: docs.map(toView),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  }
}

export async function createExpense(
  session: Session,
  input: CreateExpenseInput,
): Promise<ExpenseView> {
  await connectDB()

  const doc = await Expense.create({
    organizationId: session.organizationId,
    departmentId: session.departmentId ?? null,
    userId: session.userId,
    category: input.category,
    amount: input.amount,
    date: input.date,
    description: input.description ?? '',
    status: 'pending',
  })

  await recordAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: 'create',
    entity: 'Expense',
    entityId: String(doc._id),
  })

  return toView(doc)
}

// Returns null when the expense is outside the caller's scope, so routes can
// answer 404 without revealing that someone else's record exists.
export async function getExpense(
  session: Session,
  id: string,
): Promise<ExpenseView | null> {
  await connectDB()

  if (!mongoose.isValidObjectId(id)) return null

  const doc = await Expense.findOne({
    _id: id,
    organizationId: session.organizationId,
    ...expenseScope(session),
  }).lean<IExpense | null>()

  return doc ? toView(doc) : null
}

export async function updateExpense(
  session: Session,
  id: string,
  input: UpdateExpenseInput,
): Promise<ExpenseView> {
  await connectDB()

  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Expense not found')

  // Scoped lookup: someone else's expense is indistinguishable from a missing
  // one (404), so IDs can't be probed.
  const doc = await Expense.findOne({
    _id: id,
    organizationId: session.organizationId,
    ...expenseScope(session),
  })

  if (!doc) throw httpError(404, 'Expense not found')
  // Defense in depth: the route already requires the staff role.
  if (
    session.role !== 'staff' ||
    String(doc.userId) !== String(session.userId)
  ) {
    throw httpError(403, 'Forbidden')
  }
  if (doc.status !== 'pending') {
    throw httpError(409, 'Only pending expenses can be edited')
  }

  if (input.category !== undefined) doc.category = input.category
  if (input.amount !== undefined) doc.amount = input.amount
  if (input.date !== undefined) doc.date = input.date
  if (input.description !== undefined) doc.description = input.description

  await doc.save()

  await recordAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: 'update',
    entity: 'Expense',
    entityId: String(doc._id),
  })

  return toView(doc)
}

// Managers approve/reject pending expenses in their department (admins
// organization-wide). Approving or rejecting writes an audit entry (rule 7).
export async function reviewExpense(
  session: Session,
  id: string,
  input: ReviewExpenseInput,
): Promise<ExpenseView> {
  const scope = reviewScope(session)
  if (!scope) throw httpError(403, 'Forbidden')

  await connectDB()

  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Expense not found')

  // Scoped lookup: a record in another department is indistinguishable from a
  // missing one (404), so IDs can't be probed.
  const doc = await Expense.findOne({
    _id: id,
    organizationId: session.organizationId,
    ...scope,
  })

  if (!doc) throw httpError(404, 'Expense not found')
  if (doc.status !== 'pending') {
    throw httpError(409, 'Only pending expenses can be reviewed')
  }

  doc.status = input.action === 'approve' ? 'approved' : 'rejected'
  doc.reviewedBy = session.userId
  doc.reviewedAt = new Date()
  doc.reviewNote = input.reason?.trim() || null

  await doc.save()

  await recordAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: input.action === 'approve' ? 'approve' : 'reject',
    entity: 'Expense',
    entityId: String(doc._id),
  })

  return toView(doc)
}

export async function deleteExpense(
  session: Session,
  id: string,
): Promise<void> {
  await connectDB()

  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Expense not found')

  const doc = await Expense.findOne({
    _id: id,
    organizationId: session.organizationId,
    ...expenseScope(session),
  })

  if (!doc) throw httpError(404, 'Expense not found')
  if (
    session.role !== 'staff' ||
    String(doc.userId) !== String(session.userId)
  ) {
    throw httpError(403, 'Forbidden')
  }
  if (doc.status !== 'pending') {
    throw httpError(409, 'Only pending expenses can be deleted')
  }

  await doc.deleteOne()

  await recordAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: 'delete',
    entity: 'Expense',
    entityId: String(doc._id),
  })
}
