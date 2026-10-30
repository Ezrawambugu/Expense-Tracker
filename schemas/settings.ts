import { z } from 'zod'
import {
  WARNING_THRESHOLD_MAX,
  WARNING_THRESHOLD_MIN,
} from '@/lib/budget-status'

// Organization settings (Phase 7C). Only the warning threshold is editable so
// far; the currency option arrives in Phase 7D.
export const UpdateSettingsSchema = z
  .object({
    warningThreshold: z
      .number({ error: 'Enter a number between 0.5 and 0.95' })
      .min(
        WARNING_THRESHOLD_MIN,
        `Warning threshold must be at least ${WARNING_THRESHOLD_MIN}`,
      )
      .max(
        WARNING_THRESHOLD_MAX,
        `Warning threshold must be at most ${WARNING_THRESHOLD_MAX}`,
      ),
  })
  .strict()
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>
