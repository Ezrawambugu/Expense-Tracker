export default function HomePage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Expense Tracker</h1>
      <p className="max-w-md text-center text-neutral-500">
        A Management Information System for small-organization expense
        management. Staff record expenses, managers set budgets and approve
        requests, and admins manage users and departments.
      </p>
      <div className="flex gap-3">
        <a
          href="/login"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Sign in
        </a>
        <a
          href="/register"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Create an organization
        </a>
        <a
          href="/api/health"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          API health
        </a>
      </div>
    </main>
  )
}
