'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Role = 'admin' | 'manager' | 'staff'

// Role-aware navigation. Each role sees only its permitted destinations.
// Phase 8C: two pill groups instead of wrapping text links — primary work
// destinations in the top bar, admin destinations on their own slim row, so
// nine links never crowd a 1100px bar.
type LinkDef = { href: string; label: string; roles: Role[] }

const PRIMARY: LinkDef[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    roles: ['admin', 'manager', 'staff'],
  },
  {
    href: '/expenses',
    label: 'Expenses',
    roles: ['admin', 'manager', 'staff'],
  },
  { href: '/budgets', label: 'Budgets', roles: ['admin', 'manager'] },
  { href: '/approvals', label: 'Approvals', roles: ['manager', 'admin'] },
  { href: '/reports', label: 'Reports', roles: ['admin', 'manager'] },
]

const ADMIN: LinkDef[] = [
  { href: '/admin/users', label: 'Users', roles: ['admin'] },
  { href: '/admin/departments', label: 'Departments', roles: ['admin'] },
  { href: '/admin/audit', label: 'Audit', roles: ['admin'] },
  { href: '/admin/settings', label: 'Settings', roles: ['admin'] },
]

function PillGroup({ links, role }: { links: LinkDef[]; role: Role }) {
  const pathname = usePathname()
  const visible = links.filter((l) => l.roles.includes(role))

  return (
    <div className="bg-surface/70 border-separator/70 flex items-center gap-0.5 rounded-full border p-1">
      {visible.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`focus-visible:ring-accent/40 duration-hover ease-apple text-footnote rounded-full px-3 py-1.5 font-medium whitespace-nowrap transition-[background-color,color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-none ${
              active
                ? 'bg-accent-fill text-on-accent shadow-card'
                : 'text-muted hover:bg-surface-elevated hover:text-foreground'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </div>
  )
}

// Desktop primary navigation (hidden below md, where the tab bar takes over).
export function Nav({ role }: { role: Role }) {
  return (
    <nav aria-label="Primary" className="hidden md:block">
      <PillGroup links={PRIMARY} role={role} />
    </nav>
  )
}

// Admin-only row under the top bar. It gives the admin destinations a visible
// home on every page without widening the primary group.
export function AdminNav({ role }: { role: Role }) {
  if (role !== 'admin') return null
  return (
    <nav
      aria-label="Administration"
      className="hidden items-center gap-2 border-t border-[var(--separator)] px-0 py-1.5 md:flex"
    >
      <span className="text-caption text-muted pl-1 font-semibold tracking-wider uppercase">
        Admin
      </span>
      <PillGroup links={ADMIN} role={role} />
    </nav>
  )
}
