import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User } from 'lucide-react'
import { getSession } from '@/lib/session'
import { Nav, AdminNav } from '@/components/nav'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { LogoutButton } from '@/components/logout-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastProvider } from '@/components/toast'
import { NotificationBell } from '@/components/notification-bell'
import { unreadNotificationCount } from '@/lib/notification'
import { listNotifications } from '@/services/notification-service'

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

  // An admin-set temporary password blocks every other page until it is
  // changed. This forced page lives outside the (protected) group so it is
  // the one page the redirect below does not swallow.
  if (session.mustChangePassword) redirect('/account/change-password')

  // ToastProvider wraps the shell so a toast survives client-side navigation
  // within the protected area (the layout stays mounted across route changes).
  const unreadResult = await unreadNotificationCount(session)
  const latest = await listNotifications(session, { page: 1, pageSize: 10 })

  return (
    <ToastProvider>
      <div className="flex min-h-full flex-col">
        <a
          href="#main"
          className="bg-accent-fill text-on-accent rounded-control sr-only px-4 py-2 font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>

        {/* Sticky translucent glass bar: the only chrome that floats above the
            content, with a hairline instead of a heavy shadow. */}
        <header className="glass-bar sticky top-0 z-40">
          <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-3 px-4 sm:px-6">
            <Link
              href="/dashboard"
              className="focus-visible:ring-accent/35 rounded-control flex shrink-0 items-center gap-2 focus-visible:ring-[3px] focus-visible:outline-none"
            >
              <span className="bg-accent-fill text-on-accent shadow-card grid h-8 w-8 place-items-center rounded-[10px]">
                <span className="text-subheadline font-bold">ET</span>
              </span>
              <span className="text-headline hidden sm:inline">
                Expense Tracker
              </span>
            </Link>

            <Nav role={session.role} />

            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              <Link
                href="/account"
                aria-label="Account"
                title="Account"
                className="text-muted hover:text-foreground hover:bg-surface-elevated duration-hover focus-visible:ring-accent/35 rounded-control ease-apple text-footnote flex h-9 items-center gap-1.5 px-2 font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
              >
                <User aria-hidden="true" size={18} strokeWidth={1.75} />
                <span className="hidden lg:inline">Account</span>
              </Link>
              <ThemeToggle />
              <NotificationBell
                unreadCount={unreadResult}
                latest={latest.items}
              />
              <LogoutButton />
            </div>
          </div>

          <div className="mx-auto hidden max-w-[1100px] px-4 sm:px-6 md:block">
            <AdminNav role={session.role} />
          </div>
        </header>

        <main
          id="main"
          className="animate-rise-in mx-auto w-full max-w-[1100px] flex-1 px-4 pt-7 pb-32 sm:px-6 md:pt-9 md:pb-14"
        >
          {children}
        </main>

        <MobileTabBar role={session.role} />
      </div>
    </ToastProvider>
  )
}
