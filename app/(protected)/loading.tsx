// Loading state shown while a protected page streams its data. The skeleton
// mirrors the page rhythm (header, stat row, content card) so the layout does
// not jump when the real content arrives.
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2.5">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-8 w-64 max-w-full rounded-full" />
        <div className="skeleton h-4 w-96 max-w-full rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton rounded-card h-28" />
        ))}
      </div>
      <div className="skeleton rounded-card h-72" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
