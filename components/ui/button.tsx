import type { ButtonHTMLAttributes } from 'react'

// Phase 8B button system. Variants and sizes come straight from the token
// layer; call sites keep their existing labels and handlers, so only the
// presentation changes.
export type ButtonVariant =
  'filled' | 'tinted' | 'plain' | 'glass' | 'success' | 'destructive'

export type ButtonSize = 'default' | 'compact'

const VARIANTS: Record<ButtonVariant, string> = {
  filled: 'bg-accent-fill text-on-accent shadow-card hover:brightness-110',
  tinted: 'bg-accent-tint text-accent-text hover:brightness-[0.97]',
  plain: 'text-accent-text hover:bg-accent-tint',
  glass: 'glass text-foreground hover:brightness-[1.03]',
  // Approve (green) and reject/delete (red) read as tinted iOS controls.
  success: 'bg-ok-tint text-ok-text hover:brightness-[0.97]',
  destructive: 'bg-exceeded-tint text-exceeded-text hover:brightness-[0.97]',
}

const SIZES: Record<ButtonSize, string> = {
  // 44px minimum touch target for primary actions, 36px for compact ones.
  default: 'h-11 px-4 text-subheadline',
  compact: 'h-9 px-3 text-footnote',
}

export function Button({
  variant = 'filled',
  size = 'default',
  type = 'button',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type={type}
      {...props}
      className={`rounded-control ease-apple focus-visible:ring-accent/35 focus-visible:ring-offset-background duration-hover inline-flex items-center justify-center gap-2 font-medium transition-[transform,filter,background-color,color] select-none focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    />
  )
}
