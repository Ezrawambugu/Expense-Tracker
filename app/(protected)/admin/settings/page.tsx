import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getOrganizationSettings } from '@/services/organization-service'
import { SettingsForm } from '@/components/admin/settings-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'

// Reads the session cookie on every request — blocking route (cacheComponents).
export const instant = false

// /admin/settings — organization-wide configuration: the budget warning
// threshold and the display currency. Middleware 403s non-admins; this is
// defense-in-depth.
export default async function AdminSettingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/dashboard')

  const settings = await getOrganizationSettings(session)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description={`Organization-wide settings for ${settings.name}.`}
      />

      <Card className="p-5 sm:p-6">
        <h2 className="text-headline mb-4">Budget alerts and money</h2>
        <SettingsForm
          initialThreshold={settings.warningThreshold}
          initialCurrency={settings.currency}
        />
      </Card>
    </div>
  )
}
