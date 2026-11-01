// Phase 8D: capture documentation screenshots of every main page, for each
// seeded demo role, in light and dark, at desktop and mobile widths.
//
// Usage: npx tsx scripts/capture-screenshots.mts   (production server on :3000)
//
// Files land in docs/screenshots/ as
//   <role>-<page>-<theme>-<viewport>.png   e.g. manager-dashboard-dark-desktop.png
//   login-<theme>-<viewport>.png           public pages have no role prefix
//
// Requires the seeded demo accounts (npm run seed, password Password123!).

import { chromium } from 'playwright'

const BASE = process.env.SHOT_BASE ?? 'http://127.0.0.1:3000'
const OUT = 'docs/screenshots'
const PASSWORD = process.env.SHOT_PASSWORD ?? 'Password123!'

const VIEWPORTS = [
  { label: 'desktop', width: 1280, height: 1000, fullPage: true },
  { label: 'mobile', width: 390, height: 844, fullPage: false },
] as const

const THEMES = ['light', 'dark'] as const

const PAGES: {
  name: string
  path: string
  role: 'admin' | 'manager' | 'staff'
}[] = [
  { role: 'admin', name: 'admin-dashboard', path: '/dashboard' },
  { role: 'admin', name: 'admin-users', path: '/admin/users' },
  { role: 'admin', name: 'admin-departments', path: '/admin/departments' },
  { role: 'admin', name: 'admin-audit', path: '/admin/audit' },
  { role: 'admin', name: 'admin-settings', path: '/admin/settings' },
  { role: 'admin', name: 'admin-reports', path: '/reports' },
  { role: 'manager', name: 'manager-dashboard', path: '/dashboard' },
  { role: 'manager', name: 'manager-budgets', path: '/budgets' },
  { role: 'manager', name: 'manager-approvals', path: '/approvals' },
  { role: 'manager', name: 'manager-reports', path: '/reports' },
  { role: 'manager', name: 'manager-expenses', path: '/expenses' },
  { role: 'staff', name: 'staff-dashboard', path: '/dashboard' },
  { role: 'staff', name: 'staff-expenses', path: '/expenses' },
  { role: 'staff', name: 'staff-notifications', path: '/notifications' },
  { role: 'staff', name: 'staff-account', path: '/account' },
]

const PUBLIC_PAGES = [
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
]

async function signIn(
  page: import('playwright').Page,
  email: string,
): Promise<void> {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  // Wait for hydration; an early click submits the native form instead.
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('form button[type=submit]')
      return !!btn && Object.keys(btn).some((k) => k.startsWith('__reactProps'))
    },
    undefined,
    { timeout: 30_000 },
  )
  await page.fill('input[id=email]', email)
  await page.fill('input[id=password]', PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 30_000 })
}

async function main() {
  const browser = await chromium.launch()
  try {
    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        for (const page of PUBLIC_PAGES) {
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
          })
          await context.addInitScript((value) => {
            try {
              localStorage.setItem('theme', value)
            } catch {
              /* storage can be unavailable in private mode */
            }
          }, theme)
          const tab = await context.newPage()
          await tab.goto(`${BASE}${page.path}`, { waitUntil: 'networkidle' })
          await tab.waitForTimeout(400)
          await tab.screenshot({
            path: `${OUT}/${page.name}-${theme}-${viewport.label}.png`,
            fullPage: viewport.fullPage,
          })
          await context.close()
          console.log(`captured ${page.name}-${theme}-${viewport.label}`)
        }
      }
    }

    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        const sessions: Record<string, import('playwright').Page> = {}
        for (const email of ['admin', 'manager', 'staff']) {
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
          })
          await context.addInitScript((value) => {
            try {
              localStorage.setItem('theme', value)
            } catch {
              /* storage can be unavailable in private mode */
            }
          }, theme)
          const tab = await context.newPage()
          await signIn(tab, `${email}@example.com`)
          sessions[email] = tab
        }

        for (const page of PAGES) {
          const tab = sessions[page.role]
          await tab.goto(`${BASE}${page.path}`, {
            waitUntil: 'domcontentloaded',
          })
          await tab.locator('h1').first().waitFor({ timeout: 30_000 })
          await tab.waitForTimeout(500)
          await tab.screenshot({
            path: `${OUT}/${page.name}-${theme}-${viewport.label}.png`,
            fullPage: viewport.fullPage,
          })
          console.log(`captured ${page.name}-${theme}-${viewport.label}`)
        }

        for (const [role, tab] of Object.entries(sessions)) {
          await tab.context().close()
          delete sessions[role]
        }
      }
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('CAPTURE ERROR:', err)
  process.exit(1)
})
