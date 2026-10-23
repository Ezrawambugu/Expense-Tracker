import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { Nav } from '@/components/nav'
import { LogoutButton } from '@/components/logout-button'

// Authenticated shell for all protected pages. Middleware already guards
// routes; this is defense-in-depth and provides the role-aware chrome.
//
// This layout reads the session cookie on every request, so the route can't be
// prerendered. With cacheComponents enabled, mark it as a blocking route.
export const instant = false

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">Expense Tracker</span>
            <Nav role={session.role} />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="capitalize text-neutral-500">{session.role}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  )
}
