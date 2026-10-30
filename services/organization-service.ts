// Organization settings (Phase 7C): the warning threshold that turns a budget
// into a warning. Every lookup is scoped to the session's organization (rule 1)
// and only an admin may change it.

import { connectDB } from '@/lib/db'
import { httpError } from '@/lib/api-error'
import type { Session } from '@/lib/auth'
import { recordAudit } from '@/services/audit-service'
import { Organization, type IOrganization } from '@/models/organization'
import { BUDGET_THRESHOLDS } from '@/lib/budget-status'
import type { UpdateSettingsInput } from '@/schemas/settings'

export type OrganizationSettings = {
  name: string
  warningThreshold: number
}

// Organizations created before Phase 7C have no warningThreshold; fall back to
// the shared default rather than erroring on read.
export function warningThresholdOf(org: {
  warningThreshold?: number | null
}): number {
  return org.warningThreshold ?? BUDGET_THRESHOLDS.warning
}

export async function getOrganizationSettings(
  session: Session,
): Promise<OrganizationSettings> {
  await connectDB()

  const org = await Organization.findOne({ _id: session.organizationId })
    .select('name warningThreshold')
    .lean<Pick<IOrganization, 'name' | 'warningThreshold'> | null>()

  if (!org) throw httpError(404, 'Organization not found')

  return {
    name: org.name,
    warningThreshold: warningThresholdOf(org),
  }
}

export async function updateOrganizationSettings(
  session: Session,
  input: UpdateSettingsInput,
): Promise<OrganizationSettings> {
  // Defense in depth: the route already requires the admin role.
  if (session.role !== 'admin') throw httpError(403, 'Forbidden')

  await connectDB()

  const org = await Organization.findOneAndUpdate(
    { _id: session.organizationId },
    { $set: { warningThreshold: input.warningThreshold } },
    { new: true },
  ).lean<IOrganization | null>()

  if (!org) throw httpError(404, 'Organization not found')

  await recordAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: 'update',
    entity: 'Organization',
    entityId: String(org._id),
  })

  return {
    name: org.name,
    warningThreshold: warningThresholdOf(org),
  }
}
