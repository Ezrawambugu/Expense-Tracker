import { describe, expect, it } from 'vitest'
import {
  BUDGET_THRESHOLDS,
  budgetStatus,
  percentUsed,
} from '@/lib/budget-status'

describe('percentUsed', () => {
  it('is spent divided by budget', () => {
    expect(percentUsed(750, 1000)).toBe(0.75)
    expect(percentUsed(400, 500)).toBe(0.8)
  })

  it('never produces Infinity for a zero budget', () => {
    expect(percentUsed(100, 0)).toBe(0)
  })
})

// Business rule 6: below 80% = ok, 80% to 100% = warning, above 100% =
// exceeded. Thresholds live in one config constant.
describe('budgetStatus', () => {
  it('keeps both thresholds in a single config constant', () => {
    expect(BUDGET_THRESHOLDS).toEqual({ warning: 0.8, exceeded: 1 })
  })

  it('is ok below 80%', () => {
    expect(budgetStatus(0)).toBe('ok')
    expect(budgetStatus(0.5)).toBe('ok')
    expect(budgetStatus(0.7999)).toBe('ok')
  })

  it('is a warning from 80% through exactly 100%', () => {
    expect(budgetStatus(0.8)).toBe('warning')
    expect(budgetStatus(0.9)).toBe('warning')
    expect(budgetStatus(1)).toBe('warning')
  })

  it('is exceeded above 100%', () => {
    expect(budgetStatus(1.0001)).toBe('exceeded')
    expect(budgetStatus(1.25)).toBe('exceeded')
  })
})
