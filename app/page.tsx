export default function HomePage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Expense Tracker</h1>
      <p className="max-w-md text-center text-neutral-500">
        A Management Information System for small-organization expense
        management. Staff record expenses, managers set budgets and approve
        requests, and admins manage users and departments.
      </p>
      <a
        href="/api/health"
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        Check API health
      </a>
    </main>
  )
}
