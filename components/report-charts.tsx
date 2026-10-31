'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatAmount, formatCompactAmount } from '@/lib/format'
import type { CategoryTotal, TrendPoint } from '@/services/report-service'

// Charts use the design tokens directly (var(--accent) etc.), so light and dark
// follow the same palette as the rest of the UI, and the axis text inherits the
// muted colour from the wrapper.
const axisProps = {
  tick: { fill: 'currentColor', fontSize: 11 },
  tickLine: false,
} as const

const chartWrapperClass = 'h-64 w-full text-muted'

// Tooltips are small glass cards, matching the floating chrome elsewhere.
function GlassTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: { value?: number | string }[]
  label?: string | number
  currency: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong shadow-floating rounded-control px-3 py-2">
      <p className="text-caption text-muted">{label}</p>
      <p className="text-subheadline text-foreground font-medium tabular-nums">
        {formatAmount(Number(payload[0]?.value ?? 0), currency)}
      </p>
    </div>
  )
}

// Monthly approved spending for the last 6 months (Phase 4 output d).
export function TrendChart({
  points,
  currency,
}: {
  points: TrendPoint[]
  currency: string
}) {
  return (
    <div className={chartWrapperClass}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            stroke="var(--separator)"
            strokeOpacity={0.7}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            {...axisProps}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            {...axisProps}
            axisLine={false}
            width={64}
            tickFormatter={(value: number) =>
              formatCompactAmount(value, currency)
            }
          />
          <Tooltip
            cursor={{ stroke: 'var(--separator-strong)', strokeWidth: 1 }}
            content={<GlassTooltip currency={currency} />}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="var(--accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={{
              r: 3.5,
              fill: 'var(--surface)',
              stroke: 'var(--accent)',
              strokeWidth: 2,
            }}
            activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'none' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Approved spending by category for the chosen month (Phase 4 output d).
export function CategoryChart({
  data,
  currency,
}: {
  data: CategoryTotal[]
  currency: string
}) {
  return (
    <div className={chartWrapperClass}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            stroke="var(--separator)"
            strokeOpacity={0.7}
            vertical={false}
          />
          <XAxis
            dataKey="category"
            {...axisProps}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            {...axisProps}
            axisLine={false}
            width={64}
            tickFormatter={(value: number) =>
              formatCompactAmount(value, currency)
            }
          />
          <Tooltip
            cursor={{ fill: 'var(--accent-tint)' }}
            content={<GlassTooltip currency={currency} />}
          />
          <Bar
            dataKey="total"
            fill="var(--accent)"
            radius={[6, 6, 0, 0]}
            maxBarSize={56}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
