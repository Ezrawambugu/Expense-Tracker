'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { Icon } from '@/components/ui/icon'

// Minimal toast system: the provider lives in the protected layout, so a
// toast fired just before router.push() is still on screen after navigation.
// Phase 8B: glass capsule at the top center with a status icon. The API,
// the 4s auto-dismiss and the aria-live behaviour are unchanged.

type Toast = { id: number; message: string; tone: 'success' | 'error' }

type ToastContextValue = {
  toast: (message: string, tone?: Toast['tone']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const toast = useCallback(
    (message: string, tone: Toast['tone'] = 'success') => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, tone }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* aria-live region so success messages reach screen readers. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => {
          const isError = t.tone === 'error'
          return (
            <div
              key={t.id}
              role={isError ? 'alert' : 'status'}
              className={`glass-strong shadow-floating animate-toast-in text-subheadline pointer-events-auto flex max-w-full items-center gap-2 rounded-full px-4 py-2.5 font-medium ${
                isError ? 'text-exceeded-text' : 'text-foreground'
              }`}
            >
              <Icon
                icon={isError ? CircleAlert : CircleCheck}
                size={16}
                className={isError ? 'text-exceeded' : 'text-ok'}
              />
              <span className="truncate">{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
