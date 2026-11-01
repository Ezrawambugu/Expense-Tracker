export type ProgressTone = 'accent' | 'ok' | 'warning' | 'exceeded' | 'neutral'

const TONES: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  ok: 'bg-ok',
  warning: 'bg-warning',
  exceeded: 'bg-exceeded',
  neutral: 'bg-neutral-status',
}

// Thin, fully rounded budget meter. The fill grows from the left on load
// (transform-only, disabled under prefers-reduced-motion) and the label is
// always exposed to assistive tech, so the status never rides on colour alone.
export function Progress({
  ratio,
  tone = 'accent',
  label,
}: {
  ratio: number
  tone?: ProgressTone
  label: string
}) {
  const clamped = Math.max(0, Math.min(1, ratio))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className="bg-separator/50 h-1.5 w-full overflow-hidden rounded-full"
    >
      <div
        className={`progress-fill h-full rounded-full ${TONES[tone]}`}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  )
}
