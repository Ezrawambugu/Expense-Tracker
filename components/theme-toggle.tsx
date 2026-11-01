'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

// Light/dark toggle. The choice is stored in localStorage and applied before
// hydration by the inline script in app/layout.tsx, so there is no flash.
// Theme state is read from the DOM (not React state) via useSyncExternalStore,
// with a MutationObserver keeping it in sync when the class changes.
//
// Phase 8B: an iOS-style switch. The control is still a plain button with the
// same accessible name ("Switch to dark/light theme") so the existing UI
// checks keep finding it.

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)

  function toggle() {
    const next = !isDark()
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // Storage may be unavailable (private mode); the class still applies.
    }
  }

  const label = dark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={dark}
      title={label}
      className={`focus-visible:ring-accent/35 focus-visible:ring-offset-background duration-hover ease-apple relative h-8 w-[52px] shrink-0 rounded-full transition-colors focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:outline-none ${
        dark ? 'bg-accent-fill' : 'bg-separator-strong'
      }`}
    >
      {/* Target-theme icons sit behind the knob. */}
      <Moon
        aria-hidden="true"
        size={14}
        strokeWidth={1.75}
        className={`pointer-events-none absolute top-1/2 left-1.5 -translate-y-1/2 ${
          dark ? 'text-white/60' : 'text-white/90'
        }`}
      />
      <Sun
        aria-hidden="true"
        size={14}
        strokeWidth={1.75}
        className={`pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 ${
          dark ? 'text-white/90' : 'text-white/60'
        }`}
      />
      <span
        aria-hidden="true"
        className={`bg-surface shadow-card duration-hover ease-apple absolute top-1 left-1 h-6 w-6 rounded-full transition-transform ${
          dark ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
