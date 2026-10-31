'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useToast } from '@/components/toast'
import { NotificationIcon } from '@/components/notification-icon'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import type { NotificationType } from '@/lib/constants'

type Notification = {
  id: string
  type: NotificationType
  message: string
  link: string
  readAt: string | null
  createdAt: string
}

export function NotificationBell({
  unreadCount,
  latest,
}: {
  unreadCount: number
  latest: Notification[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>(latest)
  const [unread, setUnread] = useState(unreadCount)
  const [loaded, setLoaded] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch('/api/notifications?pageSize=10', {
          credentials: 'include',
        })
        if (!res.ok) return
        const data = (await res.json()) as {
          items?: Notification[]
          unreadCount?: number
        }
        if (cancelled) return
        if (data.items) setItems(data.items)
        // The list endpoint reports the total so the badge follows the server.
        if (typeof data.unreadCount === 'number') setUnread(data.unreadCount)
        setLoaded(true)
      } catch {
        /* ignore network errors in the dropdown */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markRead(id: string) {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    if (!res.ok) return
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, readAt: new Date().toISOString() } : it,
      ),
    )
    setUnread((prev) => Math.max(0, prev - 1))
  }

  async function markAll() {
    setOpen(false)
    const res = await fetch('/api/notifications', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    if (!res.ok) {
      toast('Could not mark all as read', 'error')
      return
    }
    const data = (await res.json()) as { updatedCount?: number }
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        readAt: it.readAt ?? new Date().toISOString(),
      })),
    )
    setUnread(0)
    toast(`Marked ${data.updatedCount ?? 0} notifications as read`)
  }

  function openNotification(id: string, href: string) {
    void markRead(id)
    setOpen(false)
    router.push(href)
  }

  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setOpen((o) => !o)}
        variant="plain"
        size="compact"
        className="relative w-9 px-0"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        {unread > 0 && (
          <span
            className="bg-exceeded text-caption absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-semibold text-white"
            aria-label={`${unread} unread`}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <Icon icon={Bell} size={20} />
      </Button>

      {open && (
        <div
          ref={panelRef}
          className="bg-surface border-separator shadow-floating rounded-card absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden border"
        >
          <div className="border-separator flex items-center justify-between gap-2 border-b px-4 py-3">
            <span className="text-headline">Notifications</span>
            <Button
              type="button"
              onClick={markAll}
              variant="plain"
              size="compact"
            >
              Mark all as read
            </Button>
          </div>
          {!loaded && (
            <div className="text-muted text-footnote px-4 py-8 text-center">
              Loading…
            </div>
          )}
          {loaded && items.length === 0 && (
            <div className="text-muted text-footnote px-4 py-8 text-center">
              No notifications yet.
            </div>
          )}
          {loaded && items.length > 0 && (
            <ul className="max-h-[400px] overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="border-separator border-b last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => openNotification(item.id, item.link)}
                    className={`hover:bg-accent-tint/40 duration-hover flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      item.readAt === null ? 'bg-accent-tint/25' : ''
                    }`}
                  >
                    <span className="text-muted mt-0.5 shrink-0">
                      <NotificationIcon name={item.type} />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-subheadline text-foreground">
                        {item.message}
                      </span>
                      <time
                        dateTime={item.createdAt}
                        className="text-footnote text-muted truncate"
                      >
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-separator border-t px-4 py-2.5 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-accent-text text-footnote font-medium"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
