import type { Metadata } from 'next'

// TEMPORARY Phase 8A page: shows the design token system in light and dark so
// the foundations can be reviewed before any component is restyled. Delete this
// route (and its proxy PUBLIC_PATHS entry) before the Phase 8 work merges.

export const metadata: Metadata = {
  title: 'Design preview — Expense Tracker',
}

type Tone = 'light' | 'dark'

const TYPE_SCALE: { token: string; sample: string; spec: string }[] = [
  { token: 'text-large-title', sample: 'Large title', spec: '34 / 41 bold' },
  { token: 'text-title', sample: 'Title', spec: '28 / 34 semibold' },
  { token: 'text-headline', sample: 'Headline', spec: '17 / 22 semibold' },
  {
    token: 'text-body',
    sample: 'Body — the default reading size',
    spec: '16 / 22',
  },
  {
    token: 'text-subheadline',
    sample: 'Subheadline — supporting copy',
    spec: '15 / 20',
  },
  {
    token: 'text-footnote',
    sample: 'Footnote — timestamps and hints',
    spec: '13 / 18',
  },
  { token: 'text-caption', sample: 'Caption — table labels', spec: '12 / 16' },
]

const SYSTEM_COLORS: {
  name: string
  className: string
  light: string
  dark: string
}[] = [
  { name: 'blue', className: 'bg-blue', light: '#007AFF', dark: '#0A84FF' },
  { name: 'green', className: 'bg-green', light: '#34C759', dark: '#30D158' },
  { name: 'orange', className: 'bg-orange', light: '#FF9500', dark: '#FF9F0A' },
  { name: 'red', className: 'bg-red', light: '#FF3B30', dark: '#FF453A' },
  { name: 'indigo', className: 'bg-indigo', light: '#5856D6', dark: '#5E5CE6' },
  { name: 'purple', className: 'bg-purple', light: '#AF52DE', dark: '#BF5AF2' },
  { name: 'teal', className: 'bg-teal', light: '#30B0C7', dark: '#40C8E0' },
  { name: 'gray', className: 'bg-gray', light: '#8E8E93', dark: '#98989D' },
]

const STATUS_STYLES: { label: string; dot: string; pill: string }[] = [
  { label: 'OK', dot: 'bg-ok', pill: 'bg-ok-tint text-ok-text' },
  {
    label: 'Warning',
    dot: 'bg-warning',
    pill: 'bg-warning-tint text-warning-text',
  },
  {
    label: 'Exceeded',
    dot: 'bg-exceeded',
    pill: 'bg-exceeded-tint text-exceeded-text',
  },
  {
    label: 'No budget',
    dot: 'bg-neutral-status',
    pill: 'bg-neutral-status-tint text-neutral-status-text',
  },
]

const CONTRAST_ROWS: {
  pair: string
  fg: string
  bg: string
  note: 'text' | 'large'
}[] = [
  {
    pair: 'Light — body on background',
    fg: '#1C1C1E',
    bg: '#F2F2F7',
    note: 'text',
  },
  {
    pair: 'Light — secondary on background',
    fg: '#6C6C70',
    bg: '#F2F2F7',
    note: 'text',
  },
  {
    pair: 'Light — accent text on surface',
    fg: '#0062CC',
    bg: '#FFFFFF',
    note: 'text',
  },
  {
    pair: 'Light — label on accent fill',
    fg: '#FFFFFF',
    bg: '#0066CC',
    note: 'text',
  },
  {
    pair: 'Light — OK badge text on tint',
    fg: '#12702F',
    bg: '#E3F7E8',
    note: 'text',
  },
  {
    pair: 'Light — warning badge text on tint',
    fg: '#8A4B00',
    bg: '#FFEED6',
    note: 'text',
  },
  {
    pair: 'Light — exceeded badge text on tint',
    fg: '#B91C1C',
    bg: '#FFE4E2',
    note: 'text',
  },
  {
    pair: 'Light — neutral badge text on tint',
    fg: '#52525B',
    bg: '#EFEFF0',
    note: 'text',
  },
  {
    pair: 'Dark — body on background',
    fg: '#F2F2F7',
    bg: '#000000',
    note: 'text',
  },
  {
    pair: 'Dark — secondary on surface',
    fg: '#98989D',
    bg: '#1C1C1E',
    note: 'text',
  },
  {
    pair: 'Dark — accent text on surface',
    fg: '#0A84FF',
    bg: '#1C1C1E',
    note: 'text',
  },
  {
    pair: 'Dark — label on accent fill',
    fg: '#FFFFFF',
    bg: '#0A6BD8',
    note: 'text',
  },
  {
    pair: 'Dark — OK badge text on tint',
    fg: '#30D158',
    bg: '#203D28',
    note: 'text',
  },
  {
    pair: 'Dark — warning badge text on tint',
    fg: '#FF9F0A',
    bg: '#45341A',
    note: 'text',
  },
  {
    pair: 'Dark — exceeded badge text on tint',
    fg: '#FF6961',
    bg: '#452323',
    note: 'text',
  },
  {
    pair: 'Dark — neutral badge text on tint',
    fg: '#C7C7CC',
    bg: '#323235',
    note: 'text',
  },
  {
    pair: 'Light — focus ring on background',
    fg: '#0066CC',
    bg: '#F2F2F7',
    note: 'large',
  },
  {
    pair: 'Dark — focus ring on background',
    fg: '#0A6BD8',
    bg: '#000000',
    note: 'large',
  },
]

// WCAG relative luminance and contrast ratio, evaluated at render time so the
// table always reflects the values listed above.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

const PANEL_GRADIENTS: Record<Tone, string> = {
  light: [
    'radial-gradient(30rem 22rem at 8% -8%, rgba(0,122,255,0.22), transparent 62%)',
    'radial-gradient(26rem 20rem at 94% 0%, rgba(175,82,222,0.2), transparent 60%)',
    'radial-gradient(28rem 22rem at 50% 112%, rgba(48,176,199,0.2), transparent 62%)',
  ].join(', '),
  dark: [
    'radial-gradient(30rem 22rem at 8% -8%, rgba(10,132,255,0.3), transparent 62%)',
    'radial-gradient(26rem 20rem at 94% 0%, rgba(191,90,242,0.28), transparent 60%)',
    'radial-gradient(28rem 22rem at 50% 112%, rgba(64,200,224,0.18), transparent 62%)',
  ].join(', '),
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-headline mt-8 mb-3 first:mt-0">{children}</h3>
}

function TypeScaleDemo() {
  return (
    <div className="space-y-3">
      {TYPE_SCALE.map((row) => (
        <div
          key={row.token}
          className="flex items-baseline justify-between gap-4"
        >
          <span className={`${row.token} truncate`}>{row.sample}</span>
          <span className="text-footnote text-muted shrink-0 tabular-nums">
            {row.token} · {row.spec}
          </span>
        </div>
      ))}
    </div>
  )
}

function PaletteDemo({ tone }: { tone: Tone }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {SYSTEM_COLORS.map((color) => (
          <div key={color.name} className="space-y-1">
            <div className={`rounded-control h-10 w-full ${color.className}`} />
            <p className="text-caption text-muted">{color.name}</p>
            <p className="text-caption text-muted tabular-nums">
              {tone === 'light' ? color.light : color.dark}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="bg-surface border-separator rounded-control border p-3">
          <p className="text-footnote text-muted">Surface</p>
          <p className="text-subheadline">White card on the wash</p>
        </div>
        <div className="bg-surface-elevated border-separator rounded-control border p-3">
          <p className="text-footnote text-muted">Elevated surface</p>
          <p className="text-subheadline">Sheets and popovers</p>
        </div>
        <div className="bg-accent-tint rounded-control p-3">
          <p className="text-footnote text-accent-text">Accent tint</p>
          <p className="text-subheadline text-accent-text">
            Tinted buttons and focus
          </p>
        </div>
        <div className="bg-accent-fill rounded-control p-3">
          <p className="text-footnote text-on-accent">Accent fill</p>
          <p className="text-subheadline text-on-accent">Primary action</p>
        </div>
      </div>
    </div>
  )
}

function StatusDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_STYLES.map((status) => (
        <span
          key={status.label}
          className={`text-footnote inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${status.pill}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      ))}
    </div>
  )
}

function GlassDemo() {
  const tiles = [
    {
      className: 'glass',
      label: 'glass',
      note: 'Navigation and page headers',
      spec: 'blur(24px)',
    },
    {
      className: 'glass-subtle',
      label: 'glass-subtle',
      note: 'Quiet overlays',
      spec: 'blur(16px)',
    },
    {
      className: 'glass-strong',
      label: 'glass-strong',
      note: 'Toasts and dialogs',
      spec: 'blur(32px)',
    },
  ]
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((tile) => (
        <div key={tile.label} className={`${tile.className} rounded-card p-4`}>
          <p className="text-headline">.{tile.label}</p>
          <p className="text-footnote text-muted">{tile.note}</p>
          <p className="text-caption text-muted mt-2 tabular-nums">
            {tile.spec} · saturate(180%)
          </p>
        </div>
      ))}
    </div>
  )
}

function ShapeDemo() {
  const radii = [
    { className: 'rounded-control', label: 'control', note: '12px' },
    { className: 'rounded-card', label: 'card', note: '20px' },
    { className: 'rounded-sheet', label: 'sheet', note: '28px' },
    { className: 'rounded-full', label: 'pill', note: 'full' },
  ]
  return (
    <div className="flex flex-wrap items-end gap-3">
      {radii.map((radius) => (
        <div key={radius.label} className="space-y-1">
          <div
            className={`bg-surface border-separator shadow-card h-16 w-16 border ${radius.className}`}
          />
          <p className="text-caption text-muted">{radius.label}</p>
          <p className="text-caption text-muted tabular-nums">{radius.note}</p>
        </div>
      ))}
      <div className="bg-surface border-separator text-footnote rounded-card shadow-card ml-2 border p-3">
        <p className="text-muted">shadow-card</p>
      </div>
      <div className="bg-surface border-separator text-footnote rounded-card shadow-floating border p-3">
        <p className="text-muted">shadow-floating</p>
      </div>
    </div>
  )
}

function MotionDemo() {
  return (
    <div className="text-footnote text-muted flex flex-wrap gap-x-6 gap-y-1 tabular-nums">
      <span>ease-apple · cubic-bezier(0.32, 0.72, 0, 1)</span>
      <span>duration-press · 120ms</span>
      <span>duration-hover · 200ms</span>
      <span>duration-enter · 350ms</span>
    </div>
  )
}

function Panel({ tone }: { tone: Tone }) {
  return (
    <section className={tone === 'dark' ? 'dark' : 'light'}>
      <div
        className={`rounded-sheet shadow-floating p-5 sm:p-7 ${
          tone === 'dark'
            ? 'text-foreground bg-black'
            : 'bg-background text-foreground'
        }`}
        style={{ backgroundImage: PANEL_GRADIENTS[tone] }}
      >
        <p className="text-footnote text-muted">Theme</p>
        <h2 className="text-title mb-6">
          {tone === 'dark' ? 'Dark' : 'Light'}
        </h2>

        <SectionTitle>Type scale</SectionTitle>
        <TypeScaleDemo />

        <SectionTitle>System palette</SectionTitle>
        <PaletteDemo tone={tone} />

        <SectionTitle>Status</SectionTitle>
        <StatusDemo />

        <SectionTitle>Glass</SectionTitle>
        <GlassDemo />

        <SectionTitle>Shape</SectionTitle>
        <ShapeDemo />

        <SectionTitle>Motion</SectionTitle>
        <MotionDemo />
      </div>
    </section>
  )
}

export default function DesignPreviewPage() {
  return (
    <main className="mx-auto w-full max-w-[1320px] space-y-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-large-title">Design tokens</h1>
        <p className="text-subheadline text-muted mt-2">
          Temporary Phase 8A preview — both themes side by side. Removed before
          the redesign merges.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel tone="light" />
        <Panel tone="dark" />
      </div>

      <section className="bg-surface border-separator rounded-card shadow-card border p-5 sm:p-7">
        <h2 className="text-title mb-1">Contrast</h2>
        <p className="text-subheadline text-muted mb-5">
          WCAG AA needs 4.5:1 for body text and 3:1 for large text and UI
          boundaries. Badge ratios sample the tint composited over its surface.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left">
            <thead className="text-caption text-muted border-separator border-b">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Pair
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Foreground / background
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  Ratio
                </th>
                <th scope="col" className="py-2 font-medium">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="text-footnote">
              {CONTRAST_ROWS.map((row) => {
                const ratio = contrastRatio(row.fg, row.bg)
                const minimum = row.note === 'text' ? 4.5 : 3
                const passes = ratio >= minimum
                return (
                  <tr
                    key={row.pair}
                    className="border-separator border-b last:border-0"
                  >
                    <td className="py-2 pr-4">{row.pair}</td>
                    <td className="text-muted py-2 pr-4 tabular-nums">
                      {row.fg} on {row.bg}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {ratio.toFixed(2)}:1
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${
                          passes
                            ? 'bg-ok-tint text-ok-text'
                            : 'bg-exceeded-tint text-exceeded-text'
                        }`}
                      >
                        {passes ? 'Pass' : 'Fail'} · AA{' '}
                        {row.note === 'text' ? '4.5' : '3'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
