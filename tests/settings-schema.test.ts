import { describe, expect, it } from 'vitest'
import { UpdateSettingsSchema } from '@/schemas/settings'

describe('UpdateSettingsSchema', () => {
  it('accepts a threshold inside the allowed 0.5–0.95 range', () => {
    expect(UpdateSettingsSchema.parse({ warningThreshold: 0.8 })).toEqual({
      warningThreshold: 0.8,
    })
    expect(
      UpdateSettingsSchema.safeParse({ warningThreshold: 0.5 }).success,
    ).toBe(true)
    expect(
      UpdateSettingsSchema.safeParse({ warningThreshold: 0.95 }).success,
    ).toBe(true)
  })

  it('rejects thresholds outside the range', () => {
    for (const warningThreshold of [0.49, 0.96, 0, 1, -0.2, 80]) {
      expect(UpdateSettingsSchema.safeParse({ warningThreshold }).success).toBe(
        false,
      )
    }
  })

  it('rejects non-numbers and extra fields', () => {
    expect(
      UpdateSettingsSchema.safeParse({ warningThreshold: 'high' }).success,
    ).toBe(false)
    expect(UpdateSettingsSchema.safeParse({}).success).toBe(false)
    expect(
      UpdateSettingsSchema.safeParse({
        warningThreshold: 0.8,
        organizationId: 'org-1',
      }).success,
    ).toBe(false)
  })
})
