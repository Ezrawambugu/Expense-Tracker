import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { CircleAlert } from 'lucide-react'
import { Icon } from '@/components/ui/icon'

// Phase 8B form controls: rounded 12px, subtle fill instead of heavy borders,
// a 3px tinted focus ring, and inline errors with an icon. Labels always sit
// above the field. Field ids, names and aria-invalid behaviour are unchanged;
// the error element carries `${id}-error` so inputs can point at it with
// aria-describedby.
const CONTROL =
  'border-separator bg-surface-elevated text-subheadline text-foreground placeholder:text-muted rounded-control block w-full border px-3 transition-[border-color,box-shadow] duration-hover ease-apple focus-visible:border-accent focus-visible:ring-accent/35 focus-visible:ring-[3px] focus-visible:outline-none aria-invalid:border-exceeded aria-invalid:ring-exceeded/25 disabled:opacity-50'

export const inputClass = `${CONTROL} h-11`
export const selectClass = `${CONTROL} h-11`
export const textareaClass = `${CONTROL} min-h-[5.5rem] py-2.5`

export function Label({
  htmlFor,
  children,
  optional = false,
  className = '',
}: {
  htmlFor: string
  children: ReactNode
  optional?: boolean
  className?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-subheadline text-foreground block font-medium ${className}`}
    >
      {children}
      {optional && <span className="text-muted font-normal"> (optional)</span>}
    </label>
  )
}

export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  children,
  className = '',
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && (
        <p className="text-footnote text-muted mt-1.5">{hint}</p>
      )}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  )
}

export function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p
      id={id}
      className="text-exceeded-text text-footnote mt-1.5 flex items-start gap-1.5"
    >
      <Icon icon={CircleAlert} size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  )
}

// Form-level failure: one tinted card instead of a one-line red box.
export function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="bg-exceeded-tint text-exceeded-text text-subheadline rounded-control flex items-start gap-2 p-3"
    >
      <Icon icon={CircleAlert} size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return <input {...rest} className={`${inputClass} ${className}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props
  return <select {...rest} className={`${selectClass} ${className}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props
  return <textarea {...rest} className={`${textareaClass} ${className}`} />
}
