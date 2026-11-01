'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bell,
  CheckCheck,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react'

type Role = 'admin' | 'manager' | 'staff'

type Tab = { href: string; label: string; icon: typeof Bell }

// Under 768px the top navigation becomes a floating glass tab bar, the way an
// iOS app keeps its primary destinations within thumb reach. Five items is the
// ceiling; everything else stays in the top bar.
const TABS: Record<Role, Tab[]> = {
  staff: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/account', label: 'Account', icon: User },
  ],
  manager: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    { href: '/approvals', label: 'Approvals', icon: CheckCheck },
    { href: '/budgets', label: 'Budgets', icon: Wallet },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
  ],
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    { href: '/approvals', label: 'Approvals', icon: CheckCheck },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/users', label: 'Admin', icon: ShieldCheck },
  ],
}

export function MobileTabBar({ role }: { role: Role }) {
  const pathname = usePathname()
  const tabs = TABS[role]

  return (
    <nav
      aria-label="Primary"
      className="glass-strong shadow-floating fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-40 rounded-[26px] md:hidden"
    >
      <ul className="flex items-stretch justify-around gap-0.5 px-1.5 py-1.5">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          const Icon = tab.icon
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`focus-visible:ring-accent/40 duration-hover ease-apple flex flex-col items-center gap-0.5 rounded-[20px] px-1 py-1.5 text-[10px] font-medium tracking-tight transition-colors focus-visible:ring-[3px] focus-visible:outline-none ${
                  active
                    ? 'bg-accent-tint text-accent-text'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Icon
                  aria-hidden="true"
                  size={21}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span className="max-w-full truncate">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
