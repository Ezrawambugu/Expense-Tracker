# Expense Tracker

A small-organization **Management Information System (MIS)** for expense management. Staff record expenses; managers set budgets, approve expenses and view reports and alerts; admins manage users and departments.

## Status

Built in phases. **Current phase: 0 — Setup.** Full documentation (MIS explanation, features by role, seed data, demo accounts, API reference) lands in Phase 6.

## Tech Stack

- **Next.js** (App Router, TypeScript)
- **MongoDB** with **Mongoose**
- **Tailwind CSS** + **shadcn/ui**
- **Zod** for shared validation
- **bcryptjs** (password hashing) and **jose** (JWT in HTTP-only cookie)
- **Recharts** for charts
- **Vitest** for logic tests
- **ESLint** + **Prettier**

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   | Variable       | Description                              |
   | -------------- | ---------------------------------------- |
   | `MONGODB_URI`  | MongoDB connection string (Atlas/local)  |
   | `JWT_SECRET`   | Secret for signing JWT session tokens    |
   | `NODE_ENV`     | `development` \| `production` \| `test`  |

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start the development server       |
| `npm run build`      | Build for production               |
| `npm run start`      | Start the production server        |
| `npm run lint`       | Run ESLint                         |
| `npm run format`     | Format with Prettier               |
| `npm test`           | Run Vitest tests                   |

## Project Structure

```
app/          # App Router routes (pages + API)
components/   # Reusable React components
lib/          # Shared utilities (db connection, auth, config)
models/       # Mongoose models
schemas/      # Shared Zod schemas
services/     # Business logic and aggregation pipelines
tests/        # Vitest tests
docs/         # Project documentation (incl. master build plan)
```

## License

University class project.
