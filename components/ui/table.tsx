import type { ReactNode } from 'react'

// Phase 8B table system: solid surface, rounded container, no vertical lines,
// hairline row separators, hover highlight, sticky header, right-aligned
// tabular numbers. Every cell can carry a label used by the stacked-card layout
// under 640px (see the `.table-stack` rules in app/globals.css), so the markup
// stays a real <table> for assistive tech and the print stylesheet.
export function TableContainer({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-card bg-surface shadow-card overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto sm:overflow-visible">{children}</div>
    </div>
  )
}

export function Table({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <table className={`table-stack w-full text-left ${className}`}>
      {children}
    </table>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

export function TH({
  children,
  numeric = false,
  className = '',
}: {
  children: ReactNode
  numeric?: boolean
  className?: string
}) {
  return (
    <th
      scope="col"
      className={`text-footnote text-muted border-separator bg-surface sticky top-0 z-10 border-b px-4 py-3 font-medium whitespace-nowrap ${
        numeric ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  )
}

export function TR({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <tr
      className={`border-separator hover:bg-accent-tint/40 duration-hover border-b transition-colors last:border-0 ${className}`}
    >
      {children}
    </tr>
  )
}

export function TD({
  children,
  label,
  numeric = false,
  className = '',
  colSpan,
}: {
  children: ReactNode
  label?: string
  numeric?: boolean
  className?: string
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      data-label={label}
      className={`px-4 py-3 align-middle ${
        numeric ? 'text-right whitespace-nowrap tabular-nums' : ''
      } ${className}`}
    >
      {children}
    </td>
  )
}
