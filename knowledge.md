# Project Knowledge

## Current phase
**Phase 1 — Authentication and roles (complete, awaiting approval).** Per `AGENTS.md`, work one phase at a time and stop for approval after each. The full build plan is in `docs/MASTER_PROMPT.md` (read it at the start of every session). Phase 0 (setup) and Phase 1 are done; Phase 2 (Expense CRUD) is next.

## Phase status
- ✅ Phase 0 — Setup: Next.js app, cached DB conn, `/api/health`, lint/build/tests green.
- ✅ Phase 1 — Auth: register (org + first admin), login/logout, JWT HTTP-only cookie, middleware + per-route guard, generic login error, login rate limiting (5/min), role-aware nav + dashboard shell.
- ⬜ Phases 2–6 — not started (expense CRUD → budgets/approvals → MIS reports → admin/polish → seed/tests/docs).

## What this is
An **Expense Tracker** MIS for a small organization — a university class project built in phases (Phase 0–6) per `docs/MASTER_PROMPT.md`. Staff record expenses, managers set budgets/approve/view reports+alerts, admin manages users/departments. Currently only Phase 0 (setup) exists: a runnable Next.js app with a working DB connection and a `/api/health` route. No domain features yet.

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
- `middleware.ts` guards **pages only** (redirect to `/login` if no session; 403 on `/admin` for non-admins, `/approvals` for non-manager/admin). API routes are guarded by `lib/guard.ts`, not middleware.
- Dev seed (Phase 1 only): `node scripts/seed-dev-users.ts` creates demo org + admin/manager/staff (`admin@example.com` etc., password `Password123!`). Real seed is `npm run seed` in Phase 6.

## Gotchas — gotchas while building
- `.env` must contain `JWT_SECRET` (and `MONGODB_URI`); missing `JWT_SECRET` makes every auth route 500. Added one.
- Mongoose model files destructure from the **default** import (`const { Schema, model, models } = mongoose`) so they work under both Next.js and Node's native ESM loader (used by `scripts/`), which rejects named imports from CJS.
- `tsconfig.json` excludes `scripts/` — those files are run directly by Node (`.ts` extension imports) and are not part of the Next app type-check.
- Next 16 warns `middleware` convention is deprecated (use `proxy`); it still builds and runs — ignore for now.

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
