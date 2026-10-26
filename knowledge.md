# Project Knowledge

## Current phase
**Phase 4 — Processing and outputs (complete, awaiting approval).** Per `AGENTS.md`, work one phase at a time and stop for approval after each. The full build plan is in `docs/MASTER_PROMPT.md` (read it at the start of every session). Phases 0–4 are done; Phase 5 (admin + polish) is next.

## Phase status
- ✅ Phase 0 — Setup: Next.js app, cached DB conn, `/api/health`, lint/build/tests green.
- ✅ Phase 1 — Auth: register (org + first admin), login/logout, JWT HTTP-only cookie, middleware + per-route guard, generic login error, login rate limiting (5/min), role-aware nav + dashboard shell.
- ✅ Phase 2 — Expense CRUD: create/list/edit/delete (owner + pending only), role-scoped lists, filters/date range/status, sorting, pagination, audit entries for create/update/delete.
- ✅ Phase 3 — Budgets and approvals: manager budget CRUD per department/category/month, approve/reject pending expenses with an optional reason, staff see status + reason, audit entries for budget create/update/delete and approve/reject.
- ✅ Phase 4 — Processing and outputs (MIS core): aggregation pipelines in `services/report-service.ts` for the summary report (by category + department), budget vs actual with rule-6 statuses, 6-month trends and alerts; `/reports` page with Recharts; CSV exports; manager alert banner and staff budget status on the dashboard.
- ⬜ Phases 5–6 — not started (admin/polish → seed/tests/docs).

## What this is
An **Expense Tracker** MIS for a small organization — a university class project built in phases (Phase 0–6) per `docs/MASTER_PROMPT.md`. Staff record expenses, managers set budgets/approve/view reports+alerts, admin manages users/departments. Implemented so far: setup + health check (Phase 0), auth with roles (Phase 1), expense CRUD (Phase 2), budgets + approvals (Phase 3) and MIS reports/alerts (Phase 4). Admin pages and the real seed are still to come.

## Tech stack (fixed by master prompt — do not substitute without asking)
Next.js (App Router, TS) · MongoDB + Mongoose · Tailwind + shadcn/ui · Zod · bcryptjs + jose (JWT in HTTP-only cookie) · Recharts · Vitest · ESLint + Prettier. Versions in use: Next 16.4.2, React 19.3.0, Tailwind v4, Node 26.

## Next.js 16 gotcha
`next.config.ts` enables `cacheComponents: true`, which **disables** the legacy `export const dynamic = 'force-dynamic'` route segment config. To force per-request rendering in a route handler, use `await connection()` from `next/server` instead (see `app/api/health/route.ts`). For pages/layouts that read `cookies()`/`headers()` (anything auth'd), prerender fails — mark them a blocking route with `export const instant = false` (see `app/(protected)/layout.tsx`).

## Auth (Phase 1) — where things live
- Models: `models/organization.ts`, `models/user.ts` (typed `IUser`/`IOrganization`; `passwordHash` is `select: false`).
- Shared Zod schemas: `schemas/auth.ts` (`RegisterSchema`, `LoginSchema`) — used by both client forms and server routes.
- Libs: `lib/auth.ts` (jose JWT sign/verify), `lib/password.ts` (bcryptjs), `lib/session.ts` (cookie get/set/clear; `SESSION_COOKIE='session'`, httpOnly+SameSite=Lax+Secure-in-prod, 8h), `lib/guard.ts` (`requireSession`/`requireRole` → 401/403), `lib/rate-limit.ts` (in-memory, 5/min per IP, reset on success).
- Service: `services/auth-service.ts` (register creates org+admin; authenticate returns null on any failure so routes return one generic message).
- Routes: `app/api/auth/{register,login,logout,me}`. Pages: `app/{login,register}`, `app/(protected)/{layout,dashboard}`.
- `middleware.ts` guards **pages only** (redirect to `/login` if no session; 403 on `/admin` for non-admins, `/approvals` and `/budgets` for non-manager/admin). API routes are guarded by `lib/guard.ts`, not middleware.
- Dev seed (Phases 1 + 3): `node scripts/seed-dev-users.ts` creates demo org + admin/manager/staff (`admin@example.com` etc., password `Password123!`) and the `Operations` department, assigning manager + staff to it (idempotent — re-running repairs users created before departments existed). Real seed is `npm run seed` in Phase 6.

## Expenses (Phase 2) — where things live
- `lib/constants.ts`: `CATEGORIES` (Transport, Supplies, Meals, Utilities, Events, Other) and `EXPENSE_STATUSES`; client-safe (no server imports).
- Models: `models/expense.ts` (indexes on `(organizationId, departmentId, date)`, `(organizationId, userId, date)`, `(organizationId, status, date)`), `models/audit-log.ts` (`AUDIT_ACTIONS` incl. approve/reject for Phase 3).
- Shared Zod schemas: `schemas/expense.ts` — `CreateExpenseSchema`/`UpdateExpenseSchema` are `.strict()` (so clients can't inject `status`/`userId`/`organizationId`), dates are `YYYY-MM-DD` (UTC midnight, not future), `ExpenseListQuerySchema` validates filters/paging/sorting. `parseDateOnly` rejects impossible dates.
- Scope: `services/expense-scope.ts` — `expenseScope(session)` is the single read-scope rule (staff=own, manager=their department, admin=org). Type-only imports (no DB), so it is unit-tested in `tests/expense-scope.test.ts`. A manager with no department matches **nothing** (not `departmentId: null`, which would expose every unassigned user's expenses).
- Service: `services/expense-service.ts` — every query also filters `organizationId`. Out-of-scope ids return 404 (no enumeration); editing/deleting a non-pending expense returns 409; audit writes go through `services/audit-service.ts`.
- Routes: `app/api/expenses` (GET list, POST staff-only), `app/api/expenses/[id]` (GET/PATCH/DELETE; mutations staff-only). Errors use `{ error, details? }` via `lib/api-error.ts`.
- Pages: `app/(protected)/expenses` (server-rendered list + GET filter form + sort links + pagination), `/expenses/new`, `/expenses/[id]/edit`; client components `components/expense-form.tsx`, `components/delete-expense-button.tsx`.
- Mutations are staff-only in this phase; managers/admins get a read-only list (403 from the API) and additionally can approve/reject from Phase 3.
- The `reviewNote` column carries the manager's optional approve/reject reason and is shown under the status badge on `/expenses` (null when unset).

## Budgets and approvals (Phase 3) — where things live
- Models: `models/budget.ts` (`organizationId`, `departmentId`, `category`, `amount`, `month` as `YYYY-MM`; **unique** index on org+department+category+month), `models/department.ts` (`organizationId`, `name` unique per org — model only; admin UI is Phase 5). Budgets reference the department but never the user.
- Shared Zod schemas: `schemas/budget.ts` (`CreateBudgetSchema`/`UpdateBudgetSchema` are `.strict()`, amount > 0, month `YYYY-MM`, update requires ≥1 field; `BudgetListQuerySchema` for month/category filters) and `ReviewExpenseSchema` in `schemas/expense.ts` (`action: approve|reject`, optional `reason` max 200, `.strict()`).
- Scopes: `services/budget-scope.ts` (manager=own department, admin=whole org read-only, staff=`null`→403; department-less manager matches nothing) and `reviewScope` in `services/expense-scope.ts` (**managers only**, own department; admin/staff=`null`→403 — admins are read-only, per the master prompt's role list).
- Service: `services/budget-service.ts` — duplicate category+month is a 409 (pre-check plus the unique index for concurrent creates); another department's budget is a 404 on read/update/delete; a manager with no department gets 400 on create. Audits entity `Budget` for create/update/delete.
- Service: `services/expense-service.ts#reviewExpense` — scoped lookup (cross-department = 404), only `pending` can be reviewed (409), sets `status`/`reviewedBy`/`reviewedAt`/`reviewNote`, audits `approve`/`reject`.
- `services/directory-service.ts` — org-scoped id→name lookups for the budgets (department) and approvals (staff) tables.
- Routes: `app/api/budgets` (GET manager/admin, POST manager), `app/api/budgets/[id]` (GET manager/admin, PATCH/DELETE manager), `app/api/expenses/[id]/review` (POST manager).
- Pages: `app/(protected)/budgets` (server-rendered list + month/category filters + inline create form for managers; admin sees it read-only), `/budgets/[id]/edit`; `app/(protected)/approvals` (pending queue, staff names, approve/reject with optional reason; admin view is read-only). Client components: `components/budget-form.tsx`, `components/delete-budget-button.tsx`, `components/review-expense-actions.tsx`.
- Budget-form inputs take an `idPrefix` because `/budgets` also renders a filter form with the same field names (duplicate ids otherwise).

## Reports and outputs (Phase 4) — where things live
- `lib/budget-status.ts` — rule 6 in ONE config constant (`BUDGET_THRESHOLDS = { warning: 0.8, exceeded: 1 }`) plus `percentUsed()` and `budgetStatus()` (below 80% ok, 80–100% warning, above 100% exceeded; exactly 100% stays a warning). Dependency-free so client and server share it; unit-tested in `tests/budget-status.test.ts`.
- `services/report-scope.ts` — `reportScope(session)`: admin → whole org (`{}`), staff/manager → their own department (budget status is department data per the roles section); a user with no department matches nothing. Unit-tested in `tests/report-scope.test.ts`.
- `services/report-service.ts` — the MIS core, all figures computed in MongoDB aggregation pipelines, never in the UI: `summaryReport` (approved total + `$facet` split by category/department, pending reported separately as awaiting — rule 5), `budgetVsActual` (one row per budget: spent/remaining/percent/status + awaiting), `budgetAlerts` (non-ok rows, worst first), `spendingTrends` (last 6 months, zero-filled). Only reads — it deliberately does NOT import `lib/api-error` (which pulls `next/server`), so verify scripts can import it under `npx tsx`.
- `services/report-csv.ts` — pure `summaryToCsv`/`budgetToCsv` builders, split out of report-service so unit tests don't need `lib/db` (which throws at import time without `MONGODB_URI`). Tests in `tests/csv.test.ts`; escaping lives in `lib/csv.ts` (`toCsv`, CRLF rows).
- `schemas/report.ts` — `ReportQuerySchema` / `ReportExportQuerySchema` (month reuses `BudgetMonthSchema` from `schemas/budget.ts`).
- Route: `app/api/reports/export/route.ts` — `GET ?report=summary|budget&month=YYYY-MM`, `requireRole('admin','manager')`, returns `text/csv` + `Content-Disposition` filename (defaults to the current month).
- Page: `app/(protected)/reports` (server component, `instant = false`) — month GET-form filter with invalid-month fallback notice, stat cards (total approved / awaiting), budget vs actual table, category + department breakdowns, Recharts line/bar charts, CSV links. Staff are redirected to `/dashboard` (middleware 403s `/reports` for them too).
- Components: `components/budget-vs-actual-table.tsx` (server-rendered table + exported `BudgetStatusBadge`; `showDepartment` for admins) and `components/report-charts.tsx` (client; `TrendChart` line + `CategoryChart` bar, colours via `currentColor` so dark mode works).
- Dashboard (`app/(protected)/dashboard/page.tsx`): managers get the alert banner + list (Phase 4 output c, links to `/budgets` and `/reports` as the MIS feedback loop); staff get a read-only department budget-status table for the current month (roles section). Admins get neither (spec puts the banner on the *manager* dashboard).
- `lib/format.ts` gained `formatPercent(ratio)` (`0.875 → "87.5%"`).
- Decisions: budget-vs-actual rows are budgets only — approved spend in a category with no budget shows up in the summary report, not the table; `/reports` nav link (admin+manager) is now live; category order everywhere follows the fixed `CATEGORIES` constant (Transport, Supplies, Meals, Utilities, Events, Other).

## Gotchas — gotchas while building
- `.env` must contain `JWT_SECRET` (and `MONGODB_URI`); missing `JWT_SECRET` makes every auth route 500. Added one.
- **Atlas IP allowlist (resolved 2026-10-24).** A non-allowlisted IP makes DNS/SRV and TCP to the shards succeed while the TLS handshake is refused with `tlsv1 alert internal error` (SSL alert 80) — so `/api/health` returns 503 and every DB-backed route fails. Fix is on the Atlas side: add the machine's public IP to the cluster's IP access list. Verified working after allowlisting: `/api/health` → `{"status":"ok","db":"connected"}`.
- Mongoose model files destructure from the **default** import (`const { Schema, model, models } = mongoose`) so they work under both Next.js and Node's native ESM loader (used by `scripts/`), which rejects named imports from CJS.
- `tsconfig.json` excludes `scripts/` — those files are run directly by Node (`.ts` extension imports) and are not part of the Next app type-check.
- Next 16 warns `middleware` convention is deprecated (use `proxy`); it still builds and runs — ignore for now.
- Scripts that import a model using a `@/` alias (e.g. `models/expense.ts` → `@/lib/constants`) **cannot** run under `node file.ts`: Node's native ESM loader can't resolve the alias. Run them with `npx tsx file.mts` instead (tsx resolves `tsconfig` paths; `.mts` is needed for top-level await because `package.json` has no `"type": "module"`). Models without aliases still run under plain Node.
- The expense form validates with the shared schema, so `parsed.data.date` is a `Date`; `JSON.stringify` would send an ISO datetime that the API's `YYYY-MM-DD` schema rejects. The form therefore sends the raw `date` string (`{ ...parsed.data, date }`). Caught by the Playwright form test.
- Playwright browsers are not installed by `npm install`; run `npx playwright install chromium` before browser checks.
- UI checks must wait for hydration before typing: a controlled input filled pre-hydration loses its value and a click falls through to a native form submit. The verify scripts wait for `__reactProps` on the target element first.
- Deleting `.next` while `next dev` is running — **or running `npm run build` between a dev-server stop and start** — leaves Turbopack in a reload storm (`✓ Compiled` before nearly every request, browser tabs refresh repeatedly). Stop all dev processes, `rm -rf .next`, start fresh; verified fixed by counting document requests (1 per load) and 0 spontaneous log lines over 30 s.
- Playwright's `framenavigated` also fires for **same-document** navigations (history updates): Next 16 dev fires one such navigation ~0.3 s after each load when Fast Refresh applies the first build (HMR `sync` hash `""` → `built` hash `"0"`). A reload detector must count `request` events with `resourceType() === 'document'`, not `framenavigated`, or it reports a false loop. This one is benign — no refetch, no reload.
- `pkill -f "next dev"` inside a shell command matches the *invoking shell's own* command line and kills it (silent, no output). Use `pkill -f "[n]ext dev"`.
- Mongoose casts ids for `.find()` but NOT inside `aggregate()` pipelines — `$match` needs `new mongoose.Types.ObjectId(...)` manually or nothing matches.
- The `Department` collection's own key is `_id`; a scope of `{ departmentId: ... }` must be mapped to `{ _id: ... }` before filtering `Department.find()` (otherwise the query matches nothing). Budget/Expense documents do have a `departmentId` field.
- Recharts 3: the line layer class is on the `<g>` (`svg path… .recharts-line-curve` matches either way, but `svg.recharts-line-curve` does NOT — the `<svg>` itself is `.recharts-surface`), and **zero-dimension bars are filtered out**, so a bar chart only renders rectangles for non-zero categories.
- `npx prettier --check .` fails on 12 pre-existing files (`.agents/**`, `lib/auth.ts`, `lib/guard.ts`, `app/(protected)/layout.tsx`, …) that Phase 4 never touched — run `npx prettier --check` on changed files instead, or format the repo separately.

## Layout
- `AGENTS.md` — project knowledge template (Quickstart / Architecture / Conventions sections are still empty placeholders).
- `.agents/types/` — TypeScript type definitions for authoring custom Codebuff agents:
  - `agent-definition.ts` — the `AgentDefinition` interface (id, model, reasoning options, tools, spawnable agents, prompts, `handleSteps` generator, etc.) plus `ModelName`, `ToolName`, and supporting step/runtime types.
  - `tools.ts` — tool-name and per-tool parameter types.
  - `util-types.ts` — message/content-part types, JSON-schema types, `MCPConfig`, and `Logger`.
- `.agents/skills/` — one directory per skill, each with a `SKILL.md` (YAML frontmatter `name` + `description`, then instructions). Installed from the community marketplace via `npx skills add <owner/repo> --skill <name> --yes`; managed/updated with `npx skills ls` / `npx skills update`. Loaded on demand via the `skill` tool by `name`:
  - `nextjs-app-router-patterns` — Next.js App Router (from `wshobson/agents`).
  - `mongoose-mongodb` — Mongoose/MongoDB schema design (from `pluginagentmarketplace/custom-plugin-nodejs`).
  - `security-and-hardening` — auth/security, OWASP (from `addyosmani/agent-skills`).
  - `zod-validation-utilities` — Zod validation & API design (from `giuseppe-trisciuoglio/developer-kit`).
  - `frontend-design` — UI/design system, Tailwind (from `anthropics/skills`).
  - `vitest` — Vitest testing (from `antfu/skills`).
  - `code-review` — code review checklist (from `mattpocock/skills`).
  - `technical-writing` — documentation writing (from `riekelt/technical-writer`).
  - `git-workflow-and-versioning` — git workflow, conventional commits (from `addyosmani/agent-skills`).
- `.agents/skills/` also holds 4 **custom orchestrator skills** (authored locally, not from the marketplace). Each is an entry point for a project job and instructs the agent to load a subset of the skills above via the `skill` tool:
  - `builder` — implements each phase from the master prompt; loads `nextjs-app-router-patterns`, `mongoose-mongodb`, `zod-validation-utilities`, `frontend-design`, `git-workflow-and-versioning`.
  - `security-reviewer` — reviews code after phases 1, 2, 3, 5 for access-control/auth flaws; **report-only, never edits**; loads `security-and-hardening`, `code-review`.
  - `test-writer` — writes and runs tests for business rules; loads `vitest`.
  - `docs-writer` — produces README and project docs in phase 6; loads `technical-writing`.

## Commands
- Install: `npm install`
- Dev server: `npm run dev` (http://localhost:3000; health check at `/api/health`)
- Production build + start: `npm run build` then `npm run start`
- Lint: `npm run lint` (ESLint; `.agents/**` is excluded — it's Codebuff scaffolding, not app code)
- Format: `npm run format` / `npm run format:check` (Prettier)
- Tests: `npm test` (Vitest; config in `vitest.config.ts`, tests in `tests/**/*.test.ts`)
- Phase 2 e2e check: `npx tsx scripts/verify-phase2.mts` — creates a throwaway org (`Phase2 Verify *`), exercises the API and browser UI, and deletes the fixtures. Needs the dev server and `.env`; exits non-zero on failure.
- Phase 3 e2e check: `npx tsx scripts/verify-phase3.mts` — throwaway org (`Phase3 Verify *`) with two departments; verifies budget CRUD/scopes/409s, approve/reject (+reason), staff status visibility, cross-department 404s, role denials and audit rows, plus the browser UI. Cleans up its fixtures; exits non-zero on failure.
- Phase 4 e2e check: `npx tsx scripts/verify-phase4.mts` — throwaway orgs (`Phase4 Verify *`) with hand-computed fixtures (approved 750/400/250 against budgets 1000/500/200 → ok/warning/exceeded, pending 100 awaiting, 5-month trend line, second org for isolation); asserts the report service, CSV exports, `/reports`, dashboards and charts against those exact numbers. Cleans up; exits non-zero on failure. **45/45 as of Phase 4.**
- Seed (Phase 6, not yet): `npm run seed`

## Environment
`.env` holds `MONGODB_URI` (a complete self-contained Atlas `mongodb+srv://` URI — credentials embedded, no separate username/password substitution needed), `JWT_SECRET`, `NODE_ENV`. `.env` is gitignored; `.env.example` is committed as the template. Build loads `.env` automatically.

## Conventions
- Custom agents live in `.agents/` and import types from `.agents/types/agent-definition`.
- Agent `id` values: lowercase letters, numbers, hyphens only (e.g. `code-reviewer`).
- Secrets are never hardcoded: MCP server env vars use the `'$VAR_NAME'` form, read from local env (e.g. `.env.local`) at agent load time.

## Gotchas
- `reasoningOptions` requires exactly one of `max_tokens` or `effort`.
- `inheritParentSystemPrompt` cannot be combined with `systemPrompt`.
- Referencing store agents from `spawnableAgents` requires the fully qualified id including publisher and version (e.g. `codebuff/file-picker@0.0.1`); local agents in `.agents/` use the bare id.
- MCP server names must not contain `/`; scoped tools use the form `'serverName/toolName'`.
