import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { connectDB } from '@/lib/db'
import { User } from '@/models/user'

// Dashboard content changes by role.
// Reads the session cookie on every request — blocking route (cacheComponents).
export const instant = false

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  await connectDB()
  const user = await User.findOne({
    _id: session.userId,
    organizationId: session.organizationId,
  }).lean()

  const greeting = user?.name ? `Welcome, ${user.name}` : 'Welcome'

  const blurb: Record<string, string> = {
    admin: 'You manage users and departments and can see everything in your organization.',
    manager: 'You set budgets, approve expenses for your department, and view reports.',
    staff: 'You record your expenses and can view your department’s budget status.',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
        <p className="mt-1 text-neutral-500">
          {blurb[session.role] ?? 'You are signed in.'}
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <dt className="text-neutral-500">Role</dt>
            <dd className="font-medium capitalize">{session.role}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Organization</dt>
            <dd className="font-medium">{session.organizationId}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Department</dt>
            <dd className="font-medium">{session.departmentId ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
