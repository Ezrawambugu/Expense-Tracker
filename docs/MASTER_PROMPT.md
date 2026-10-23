ROLE
You are a senior full-stack engineer. Build a Management Information System (MIS) called "Expense Tracker" from scratch for a university class project. Work in phases. After each phase, run lint, build and tests, summarize what you did in 5 lines or fewer, then STOP and wait for my approval before starting the next phase.

PROJECT GOAL
A small-organization expense management system. Staff record expenses. Managers set budgets, approve expenses and view reports and alerts. An admin manages users and departments. It must clearly demonstrate the MIS model:
- Inputs: expenses and budgets entered by users
- Processing: totals per category and department, comparison with budgets
- Outputs: summary reports, budget vs actual, alerts, monthly trends
- Feedback: managers adjust budgets based on the outputs

TECH STACK (do not substitute without asking)
- Next.js (latest stable, App Router) with TypeScript
- MongoDB with Mongoose (connection cached for dev hot-reload)
- Tailwind CSS and shadcn/ui
- Zod for validation (shared between client and server)
- bcryptjs for password hashing
- jose for JWT, stored in an HTTP-only, SameSite=Lax, Secure-in-production cookie
- Recharts for charts
- Vitest for logic tests
- ESLint and Prettier

USERS AND ROLES
- admin: manages users and departments; sees everything in the organization.
- manager: sets budgets; sees all expenses of their department; approves or rejects expenses; views reports.
- staff: records expenses; sees only their own expenses; sees the budget status of their own department (read-only).

DATA MODEL (Mongoose)
- Organization: name, createdAt
- Department: organizationId, name
- User: organizationId, departmentId, name, email (unique), passwordHash, role (admin|manager|staff), isActive, createdAt
- Budget: organizationId, departmentId, category, amount, month (format YYYY-MM)
- Expense: organizationId, departmentId, userId, category, amount, date, description, status (pending|approved|rejected), reviewedBy, reviewedAt, createdAt
- AuditLog: organizationId, userId, action, entity, entityId, createdAt
- Categories are a fixed constant list: Transport, Supplies, Meals, Utilities, Events, Other.
- Add sensible indexes, for example a compound index on (organizationId, departmentId, month) for budgets and (organizationId, departmentId, date) for expenses.

BUSINESS RULES
1. Multi-tenant: every database query is filtered by organizationId taken from the session.
2. Never trust userId, organizationId or role sent by the client. Always derive them from the verified session cookie.
3. Validation: amount > 0, date not in the future, category in the allowed list, description max 200 characters.
4. Staff can edit or delete their own expense only while its status is pending.
5. Only approved expenses count toward budget totals. Pending expenses are shown separately as "awaiting approval".
6. Budget status = spent / budget amount. Below 80% = ok. 80% to 100% = warning. Above 100% = exceeded. Keep thresholds in one config constant.
7. Write an AuditLog entry for create, update, delete, approve and reject actions.
8. Passwords are never returned by any API or logged.

PHASES

Phase 0 - Setup
- Initialize the project, folder structure (app, components, lib, models, schemas, services, tests), ESLint, Prettier, Vitest.
- Create lib/db.ts (cached connection), .env.example (MONGODB_URI, JWT_SECRET, NODE_ENV), a clean README skeleton.
- Add a /api/health route. Definition of done: app runs, DB connects, lint and build pass.

Phase 1 - Authentication and roles (minimum viable demo)
- Register page creates a new Organization and its first admin user.
- Login and logout. JWT in HTTP-only cookie with an expiry.
- Middleware protects pages; every API route also checks the session and role server-side.
- Generic login error message (do not reveal whether the email exists). Simple rate limiting on login.
- Role-aware navigation and a protected dashboard shell.
- Definition of done: all three roles can log in and see different navigation; unauthorized access returns 401 or 403.

Phase 2 - Expense CRUD
- Staff create, list, edit and delete their own expenses (rules 3 and 4).
- List has filters (category, date range, status), pagination and sorting.
- Managers see their department's expenses; admins see all.
- Definition of done: full CRUD works, ownership is enforced on the server, and a staff user cannot read or change another user's data by changing an ID.

Phase 3 - Budgets and approvals
- Managers create, edit and delete budgets per category and month for their department.
- Managers approve or reject pending expenses (with an optional reason).
- Staff see the status of their expenses (pending, approved, rejected).
- Definition of done: approval changes status and writes an audit log entry.

Phase 4 - Processing and outputs (the MIS core)
- Put the logic in a services layer using MongoDB aggregation pipelines, not in the UI.
- Outputs to build:
  a) Summary report: total approved spending for a chosen month, split by category and department.
  b) Budget vs actual table: budget, spent, remaining, percent used, status (ok / warning / exceeded).
  c) Alerts: a banner and a list on the manager dashboard for categories at warning or exceeded.
  d) Trends: monthly spending line chart for the last 6 months, and a category pie or bar chart.
  e) Export the summary report and budget vs actual as CSV.
- Definition of done: the numbers match the seeded data exactly, and status thresholds are tested.

Phase 5 - Admin and polish
- Admin pages: create and deactivate users, assign roles and departments, manage departments.
- Responsive layout, light and dark themes, loading and empty states, toast messages, accessible forms.
- Security pass: security headers, input validation on every route, no secrets in the repo, consistent error format { error: string, details?: any }.

Phase 6 - Seed data, tests and documentation
- npm run seed creates: 1 organization, 3 departments, 1 admin, 2 managers, 5 staff, 3 months of expenses, and budgets arranged so at least one category is ok, one is warning and one is exceeded (so the demo shows alerts).
- Tests (Vitest): budget status calculation, role permission checks, expense validation, and the report aggregation functions.
- Update README: overview, MIS explanation (input, processing, output, feedback), features by role, setup steps, environment variables, seed command, demo accounts, API summary, limitations and future work.

UI PAGES
/login, /register, /dashboard (content changes by role), /expenses, /expenses/new, /budgets, /approvals, /reports, /admin/users, /admin/departments.

WORKING RULES
- Build only what is described. No extra features. If something is ambiguous, ask one short question instead of guessing.
- Prefer small, readable files and clear names. Comment only where the logic is not obvious.
- Keep business logic out of components and route handlers; put it in services.
- Use environment variables for all secrets. Never commit .env.
- After each phase: run lint, build and tests, then give me a short summary, the list of files changed, and how to test it manually. Then stop.

Start with Phase 0 now.

