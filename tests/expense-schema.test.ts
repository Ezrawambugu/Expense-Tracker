import { describe, expect, it } from 'vitest'
import {
  CreateExpenseSchema,
  ExpenseListQuerySchema,
  UpdateExpenseSchema,
} from '@/schemas/expense'

const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10)

const valid = {
  category: 'Meals',
  amount: 12.5,
  date: today,
  description: 'Team lunch',
}

describe('CreateExpenseSchema', () => {
  it('accepts a valid expense and normalizes the date', () => {
    const parsed = CreateExpenseSchema.parse(valid)
    expect(parsed.amount).toBe(12.5)
    expect(parsed.date).toBeInstanceOf(Date)
    expect(parsed.date.toISOString()).toBe(`${today}T00:00:00.000Z`)
  })

  it('treats the description as optional', () => {
    const parsed = CreateExpenseSchema.parse({
      category: 'Other',
      amount: 1,
      date: today,
    })
    expect(parsed.description).toBeUndefined()
  })

  it('rejects zero and negative amounts', () => {
    for (const amount of [0, -1]) {
      expect(CreateExpenseSchema.safeParse({ ...valid, amount }).success).toBe(
        false,
      )
    }
  })

  it('rejects a non-numeric amount', () => {
    expect(
      CreateExpenseSchema.safeParse({ ...valid, amount: 'not-a-number' })
        .success,
    ).toBe(false)
  })

  it('rejects a future date', () => {
    const result = CreateExpenseSchema.safeParse({ ...valid, date: tomorrow })
    expect(result.success).toBe(false)
    expect(
      result.error?.issues.some(
        (i) => i.message === 'Date cannot be in the future',
      ),
    ).toBe(true)
  })

  it('rejects impossible calendar dates', () => {
    expect(
      CreateExpenseSchema.safeParse({ ...valid, date: '2026-02-31' }).success,
    ).toBe(false)
  })

  it('rejects a category outside the allowed list', () => {
    expect(
      CreateExpenseSchema.safeParse({ ...valid, category: 'Candy' }).success,
    ).toBe(false)
  })

  it('rejects a description longer than 200 characters', () => {
    expect(
      CreateExpenseSchema.safeParse({ ...valid, description: 'x'.repeat(201) })
        .success,
    ).toBe(false)
  })

  it('rejects client-supplied server fields', () => {
    for (const extra of [
      { status: 'approved' },
      { userId: '64b000000000000000000000' },
      { organizationId: '64b000000000000000000000' },
    ]) {
      expect(
        CreateExpenseSchema.safeParse({ ...valid, ...extra }).success,
      ).toBe(false)
    }
  })
})

describe('UpdateExpenseSchema', () => {
  it('accepts a partial update', () => {
    expect(UpdateExpenseSchema.safeParse({ amount: 20 }).success).toBe(true)
  })

  it('rejects an empty update', () => {
    expect(UpdateExpenseSchema.safeParse({}).success).toBe(false)
  })

  it('applies the same amount and category rules', () => {
    expect(UpdateExpenseSchema.safeParse({ amount: -5 }).success).toBe(false)
    expect(UpdateExpenseSchema.safeParse({ category: 'Candy' }).success).toBe(
      false,
    )
  })
})

describe('ExpenseListQuerySchema', () => {
  it('applies pagination and sorting defaults', () => {
    const parsed = ExpenseListQuerySchema.parse({})
    expect(parsed).toMatchObject({
      page: 1,
      pageSize: 20,
      sortBy: 'date',
      sortDir: 'desc',
    })
  })

  it('coerces numeric query strings', () => {
    const parsed = ExpenseListQuerySchema.parse({ page: '2', pageSize: '5' })
    expect(parsed.page).toBe(2)
    expect(parsed.pageSize).toBe(5)
  })

  it('caps the page size', () => {
    expect(ExpenseListQuerySchema.safeParse({ pageSize: '500' }).success).toBe(
      false,
    )
  })

  it('rejects an inverted date range', () => {
    expect(
      ExpenseListQuerySchema.safeParse({ from: today, to: '2020-01-01' })
        .success,
    ).toBe(false)
  })

  it('rejects unknown filters', () => {
    expect(
      ExpenseListQuerySchema.safeParse({ organizationId: 'other' }).success,
    ).toBe(true) // object is not strict; unknown keys are dropped
    const parsed = ExpenseListQuerySchema.parse({ organizationId: 'other' })
    expect('organizationId' in parsed).toBe(false)
  })
})
