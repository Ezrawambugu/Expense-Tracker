import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { ChangePasswordForm } from '@/components/change-password-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'

// Reads the session cookie on every request — blocking route (cacheComponents).
export const instant = false

// /account — available to every role: change your own password.
export default async function AccountPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="mx-auto max-w-xl space-y-7">
      <PageHeader
        title="Account"
        description="Change your password. Your current password is required."
      />

      <Card className="p-5 sm:p-6">
        <ChangePasswordForm />
      </Card>
    </div>
  )
}
