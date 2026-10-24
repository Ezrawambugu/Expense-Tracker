// Audit trail (business rule 7). Kept tiny so callers don't need to know the
// collection name; failures propagate so a mutation is never silently unaudited.

import { connectDB } from '@/lib/db'
import { AuditLog, type AuditAction } from '@/models/audit-log'

export async function recordAudit(input: {
  organizationId: string
  userId: string
  action: AuditAction
  entity: string
  entityId: string
}): Promise<void> {
  await connectDB()
  await AuditLog.create({
    organizationId: input.organizationId,
    userId: input.userId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
  })
}
