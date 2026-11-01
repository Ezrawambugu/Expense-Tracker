// Type icon for a notification. Uses the shared lucide icon wrapper, so it is
// dependency-light and works in both the client bell and the server-rendered
// /notifications page.
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import type { NotificationType } from '@/lib/constants'
import { Icon } from '@/components/ui/icon'

const ICONS: Record<NotificationType, LucideIcon> = {
  expense_approved: CircleCheck,
  expense_rejected: CircleX,
  expense_pending: Clock,
  budget_warning: TriangleAlert,
  budget_exceeded: CircleAlert,
}

export function NotificationIcon({
  name,
  size = 16,
}: {
  name: NotificationType
  size?: number
}) {
  return <Icon icon={ICONS[name]} size={size} />
}
