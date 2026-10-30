# Expense Tracker

A small-organization **Management Information System (MIS)** for expenses: staff record spending, managers set budgets and approve expenses, and admins manage people and departments. Every figure (totals, budget status, alerts, trends) is computed in MongoDB aggregation pipelines, never in the UI.

## MIS explanation

The system closes the classic plan / do / observe / act loop:

| Stage | What happens |
| --- | --- |
| **Input** | Staff enter expenses (category, amount, date, description). Managers enter budgets per department, category and month. |
| **Processing** | MongoDB aggregation pipelines total approved spending by category and department, compare it with budgets, and derive a status (ok / warning / exceeded) from the thresholds in `lib/budget-status.ts`. Pending expenses are counted separately. |
| **Output** | A summary report, a budget vs actual table, 6-month trend and category charts, CSV exports, and role-specific dashboards. |
| **Feedback** | Managers see an alerts banner for categories at 80% or more, adjust budgets, and approve or reject expenses; every mutation is written to an audit log. |

## Features by role

| Role | Can do | Cannot do |
| --- | --- | --- |
| **staff** | Create, edit and delete their own expenses while pending; filter, sort and page through them; see their department's budget status (read-only); track approval status and reasons | Set budgets, approve expenses, view reports, manage users |
| **manager** | Everything staff can do in their department; create, edit and delete department budgets; approve or reject pending expenses with an optional reason; view reports, charts and alerts; export CSV | Create or deactivate users, manage departments, see other departments |
| **admin** | Manage users (create, assign role/department, deactivate/reactivate) and departments (create, rename, archive/unarchive, delete when unused); read the organization's audit log; set the warning threshold and currency; view every department's expenses, budgets and reports read-only | Approve or reject expenses (managers do that), change their own role or status |

Registration creates a new organization and its first admin, so every organization's data is isolated (multi-tenant: every query is filtered by the session's `organizationId`).

An email address belongs to **one organization**: addresses are unique across the whole database, so an address that already has an account cannot register a second organization.

## Getting started

### Prerequisites

- Node.js 20+
- A MongoDB database (local or Atlas)

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string (`mongodb://` or `mongodb+srv://`) |
| `JWT_SECRET` | yes | Secret used to sign the session JWT; any long random string |
| `NODE_ENV` | no | `development` (default), `production` or `test` |

`.env` is gitignored; `.env.example` is the committed template. Missing `MONGODB_URI` or `JWT_SECRET` makes the app fail fast at startup.

### 3. Seed the demo data

```bash
npm run seed
```

Creates 1 organization ("Demo Organization"), 3 departments (Operations, Finance, Outreach), 8 users (1 admin, 2 managers, 5 staff), budgets and 3 months of expenses. The current month is arranged so Operations shows one ok, one warning and one exceeded category, so the manager dashboard displays alerts immediately. Re-running rebuilds the demo budgets and expenses.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000. Health check: http://localhost:3000/api/health.

### Demo accounts

All use password `Password123!`:

| Email | Role | Department |
| --- | --- | --- |
| `admin@example.com` | admin | (organization-wide) |
| `manager@example.com` | manager | Operations |
| `manager2@example.com` | manager | Finance |
| `staff@example.com` | staff | Operations |
| `staff2@example.com` | staff | Operations |
| `staff3@example.com` | staff | Finance |
| `staff4@example.com` | staff | Finance |
| `staff5@example.com` | staff | Outreach |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run seed` | Create/refresh the demo data |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier write/check |
| `npm test` / `npm run test:watch` | Vitest unit tests |

End-to-end checks (dev server must be running): `npx tsx scripts/verify-phase3.mts`, `scripts/verify-phase4.mts`, `scripts/verify-phase5.mts`. Each creates throwaway organizations, asserts the behavior against fixtures, cleans up and exits non-zero on failure.

## Project structure

```
app/          # App Router: pages and API route handlers
components/   # React components (forms, tables, charts, toasts)
lib/          # Cross-cutting utilities (db, auth, session, guard, config)
models/       # Mongoose schemas and indexes
schemas/      # Shared Zod schemas (client and server)
services/     # Business logic, scoping rules, aggregation pipelines
tests/        # Vitest unit tests
docs/         # Master build plan
scripts/      # Seed and verification scripts
```

Business logic lives in `services/`; route handlers only validate, guard and shape responses; components only render.

## API summary

All routes are under `/api`. Errors use a consistent envelope: `{ "error": string, "details"?: any }`. Session is an HTTP-only cookie; mutations require it plus the role shown below.

### Health

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | public | `{ status, db }` |

### Authentication

| Method | Path | Role | Body / notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | `{ organizationName, name, email, password }`; creates the org and its first admin |
| POST | `/api/auth/login` | public | `{ email, password }`; generic 401 message, rate limited to 5 attempts/minute per IP |
| POST | `/api/auth/logout` | any session | Clears the cookie |
| GET | `/api/auth/me` | any session | Current session, or 401 |

### Expenses

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/expenses` | admin, manager, staff | Filters `category`, `status`, `from`, `to`; paging via `page`/`pageSize` (max 100), sorting via `sortBy` (`date`, `amount`, `createdAt`) and `sortDir`; scope: staff own, manager department, admin all |
| POST | `/api/expenses` | staff | `{ category, amount, date, description }`; amount > 0, date not in the future, description max 200 |
| GET | `/api/expenses/:id` | admin, manager, staff | 404 outside the caller's scope |
| PATCH | `/api/expenses/:id` | staff (owner, pending only) | 403 for others, 409 once reviewed |
| DELETE | `/api/expenses/:id` | staff (owner, pending only) | As above |
| POST | `/api/expenses/:id/review` | manager (own department) | `{ action: approve, reason? }` or `{ action: reject, reason? }` |

### Budgets

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/budgets` | manager, admin | `month` and `category` filters; manager sees own department, admin sees all |
| POST | `/api/budgets` | manager | `{ category, amount, month }` for the manager's own department; 409 for a duplicate department/category/month |
| GET | `/api/budgets/:id` | manager, admin | 404 outside scope |
| PATCH | `/api/budgets/:id` | manager (own department) | Partial update |
| DELETE | `/api/budgets/:id` | manager (own department) | |

### Reports

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/reports/export?report=summary\|budget&month=YYYY-MM` | admin, manager | CSV download; `month` defaults to the current month |

Report data itself is server-rendered on `/reports`; charts are Recharts components.

### Admin

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/users` | admin | List with department names |
| POST | `/api/admin/users` | admin | `{ name, email, password, role, departmentId }` (use `null` for no department); 409 on a duplicate email |
| PATCH | `/api/admin/users/:id` | admin | any of `{ name?, email?, role?, departmentId?, isActive? }`; cannot change own role/status, org must keep one active admin |
| GET | `/api/admin/departments` | admin | Includes `userCount` |
| POST | `/api/admin/departments` | admin | `{ name }`; 409 on a duplicate name in the org |
| PATCH | `/api/admin/departments/:id` | admin | Rename |
| DELETE | `/api/admin/departments/:id` | admin | 409 while users or budgets reference it |

## Security notes

- Passwords are hashed with bcryptjs and never returned or logged.
- Sessions are JWTs in an HTTP-only, SameSite=Lax, Secure-in-production cookie, 8 hour expiry; role and department are re-read from the database on every API call, so deactivation and role changes apply immediately.
- Every API route re-checks the session and role server-side; middleware additionally guards pages.
- Login returns one generic error and is rate limited (5/minute per IP).
- Security headers on every response: CSP (no `unsafe-eval` in production), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS in production.
- Every create, update, delete, approve and reject writes an `AuditLog` entry.

## Limitations

- Single database, single deployment: no background jobs, queues or scheduled reports; trend and alert data are computed on request.
- Session expiry is fixed at 8 hours with no refresh or "remember me".
- No password reset or invitation flow; an admin cannot change an existing user's password (password resets are out of scope for this project).
- No file attachments or receipt uploads; expenses are amounts plus a text description.
- The login rate limiter is in memory, so it resets on restart and is per-process (not shared across instances).
- Report exports cover the summary and budget vs actual tables only; charts are not exported.
- An email address belongs to one organization only: uniqueness is global across the database, not per organization.

## Future work

- Password reset and invitation emails.
- Recurring budgets and budget carry-over between months.
- Export formats beyond CSV (for example XLSX or PDF) and a chart export.
- Notification when a category crosses the warning threshold.
- Sharing the rate limiter through a store such as Redis for multi-instance deployments.
- Per-organization branding.

## License

University class project.
