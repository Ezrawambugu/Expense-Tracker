ROLE
You are continuing work on the Expense Tracker MIS (Next.js, Tailwind v4, shadcn/ui, TypeScript). This is Phase 8: a visual redesign inspired by Apple's design language, including Liquid Glass. This phase must NOT change behavior, routes, API contracts, permissions or data logic. It is styling and presentation only, plus small structural changes needed for layout (for example a mobile tab bar). All earlier rules still apply. Work one sub-phase at a time. After each: run lint, build, npm test and the existing verify scripts (they drive the browser UI, so keep existing text labels, roles, ids and idPrefix conventions stable; if a selector must change, update the script in the same change), take screenshots, update knowledge.md, summarize in 5 lines or fewer with files changed, then STOP and wait for my approval. Work on a git branch named phase-8 with small conventional commits.

SKILLS TO LOAD
- frontend-design and builder for every sub-phase
- code-review after each sub-phase

DESIGN PRINCIPLES
- Inspired by Apple's design language (clarity, deference, depth), not a copy of Apple's assets. Do not use Apple logos, SF Symbols or the SF Pro font files.
- Glass is for navigation bars, page headers, floating cards, toasts, dialogs and the mobile tab bar. Tables, forms with many fields and report data sit on solid or near-solid surfaces for readability. Never nest glass inside glass.
- Content first: generous spacing, clear hierarchy, few borders, soft shadows.
- Everything must meet WCAG AA contrast (4.5:1 for body text, 3:1 for large text and UI boundaries) in BOTH light and dark themes. Check status badges especially: white text on iOS green or orange fails AA, so use tinted badges with darker text or dark text on those fills.
- Respect prefers-reduced-motion and prefers-reduced-transparency. Provide a solid fallback when backdrop-filter is unsupported (@supports).

PHASE 8A - Design tokens and foundations
1. Define all tokens once in app/globals.css using Tailwind v4 @theme and CSS variables, for light and dark (class-based dark mode already exists; keep the toggle and no-flash script).
2. Typography: font stack -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", then Inter (loaded with next/font, self-hosted, display swap), then system-ui, sans-serif. Scale: large title 34px/41px bold, title 28px semibold, headline 17px semibold, body 15-16px, subheadline 15px, footnote 13px, caption 12px. Slight negative letter-spacing (-0.01em) on titles. Apply font-variant-numeric: tabular-nums to every money, percent and count display.
3. Colors (iOS system palette). Light: background #F2F2F7, surface #FFFFFF, text #1C1C1E, secondary text #6C6C70, separator rgba(60,60,67,0.18), blue #007AFF, green #34C759, orange #FF9500, red #FF3B30, indigo #5856D6, purple #AF52DE, teal #30B0C7. Dark: background #000000, surface #1C1C1E, elevated #2C2C2E, text #F2F2F7, secondary text #98989D, separator rgba(84,84,88,0.5), blue #0A84FF, green #30D158, orange #FF9F0A, red #FF453A, indigo #5E5CE6, purple #BF5AF2, teal #40C8E0. Primary action color is blue. Budget status mapping: ok = green, warning = orange, exceeded = red, unbudgeted = gray. Verify contrast and adjust text variants as needed.
4. Shape: control radius 12px, card radius 20px, dialog and sheet radius 28px, pills fully rounded. Shadows are soft and layered (for example 0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)).
5. Glass utilities (.glass, .glass-subtle, .glass-strong). Starting values, tune by eye: light background rgba(255,255,255,0.55), dark rgba(28,28,30,0.55); backdrop-filter blur(24px) saturate(180%); 1px border rgba(255,255,255,0.35) in light and rgba(255,255,255,0.12) in dark; box-shadow 0 8px 32px rgba(0,0,0,0.12) plus an inset 0 1px 0 rgba(255,255,255,0.5) highlight. Add the @supports fallback (solid color) and a prefers-reduced-transparency solid override.
6. App background: a fixed, soft multi-color gradient (blue, purple, teal at low opacity on the light background; deep navy and purple glow on dark) so glass has something to blur. Keep it subtle and static (no animation).
7. Motion tokens: easing cubic-bezier(0.32, 0.72, 0, 1); durations 120ms (press), 200ms (hover, color), 350ms (enter/exit).
Definition of done: a temporary /design-preview page (remove before merge) shows type scale, colors, glass surfaces, and radii in light and dark; contrast checked.

PHASE 8B - Components
Restyle shared components only; no logic changes.
1. Buttons: variants filled (blue), tinted (blue at 15% with blue text), plain (text only), glass, and destructive (red). Radius 12px, height 44px for primary (minimum 44px touch target), 36px compact. Press state scales to 0.97. Visible 3px focus ring in a tinted blue. Disabled state is clear but not invisible.
2. Inputs, selects, textareas: rounded 12px, subtle fill (not heavy borders), clear focus ring, inline error text in red with an icon, labels above fields.
3. Status badges: capsule, tinted background with matching text, small dot or icon. Used for budget status and expense status (pending, approved, rejected). Do not rely on color alone; keep the text label.
4. Cards: solid surface with soft shadow by default; .glass only for floating or hero cards (the dashboard alert banner is a tinted glass card).
5. Tables: solid surface, rounded container, no vertical lines, hairline row separators, sticky header on long lists, hover row highlight, right-aligned tabular numbers. Under 640px, render rows as stacked cards (iOS grouped-list style).
6. Toasts: glass capsule at the top center, icon plus message, enter/exit with the motion tokens.
7. Theme toggle: iOS-style switch with sun and moon icons. Keep persistence behavior.
8. Segmented control component for filters that currently are small tab-like choices (for example report type), keeping the same URL and state behavior.
9. Icons: lucide-react, stroke width 1.75, consistent size.
Definition of done: all shared components render correctly in both themes; existing verify scripts pass.

PHASE 8C - Pages and layout
1. App shell: a sticky translucent glass top bar with the app name, role-aware navigation as a pill group (active item has a filled pill), notifications and theme toggle on the right if they exist. Content max width about 1100px, centered.
2. Page headers: iOS-style large title with a quiet secondary line (for example the month or the department) and primary actions aligned right.
3. Login and register: a centered glass card over the gradient, large title, filled primary button, friendly error text.
4. Dashboard: stat cards with large numbers, budget status as progress bars with the status color (thin, rounded, animated fill on load), alert banner as tinted glass with an icon and links.
5. Reports: charts use the Apple palette with rounded bar ends, soft gridlines, readable axis labels, tooltips as small glass cards; dark mode colors adjusted; keep the month filter and export buttons. Keep print styles readable (solid backgrounds when printing).
6. Expenses, budgets, approvals: restyle lists and forms using the new components; approve and reject buttons use green-tinted and red-tinted variants.
7. Admin pages: same table and form styling; destructive actions use the red destructive variant.
8. Loading and empty states: skeleton shimmer for loading, friendly empty states with an icon and one clear action.
9. Mobile (under 768px): replace the top navigation links with a floating glass bottom tab bar (icons plus short labels, active item tinted blue, safe-area padding with env(safe-area-inset-bottom)); keep the top bar to the title and theme toggle. Ensure nothing is hidden behind the bar.
Definition of done: every existing page is restyled in light and dark at 390px, 768px and 1280px wide with no horizontal scroll and no clipped content.

PHASE 8D - Motion, accessibility, performance, screenshots
1. Motion: subtle hover and press transitions, fade and slight rise on page content, list items appear without heavy animation. Disable or reduce everything under prefers-reduced-motion.
2. Accessibility audit: contrast in both themes, keyboard navigation and visible focus on every control, aria labels on icon-only buttons, status never conveyed by color alone, form errors linked with aria-describedby, tab bar and nav have proper landmarks. Fix issues found.
3. Performance: limit simultaneous backdrop-filter elements (the top bar, the mobile tab bar, toasts and dialogs only). Run Lighthouse on /login and /dashboard and report scores; keep Performance and Accessibility above 90 if achievable.
4. Screenshots for documentation and the presentation: write a Playwright script scripts/capture-screenshots.mts that logs in as each seeded demo role and saves PNGs of every main page, in light and dark, at desktop and mobile widths, into docs/screenshots/. Name files clearly (for example manager-dashboard-dark-desktop.png).
5. Remove the /design-preview page. Update the README with a short UI section and a few screenshots, and update knowledge.md with where the design tokens and glass utilities live.
Definition of done: lint, build, unit tests and all verify scripts pass; screenshots generated; accessibility checklist reported with any known gaps listed honestly.

PHASE 8E - OPTIONAL stretch (only if I ask)
Add real refraction on the top bar only, using an SVG displacement filter applied through backdrop-filter, enabled only where supported (Chromium) with the normal glass as the fallback. Do not start this unless I explicitly say so.

NOW
Start with Phase 8A.
