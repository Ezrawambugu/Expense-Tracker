'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export function LogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleLogout() {
    setBusy(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setBusy(false)
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={busy}
      variant="plain"
      size="compact"
    >
      <Icon icon={LogOut} size={16} />
      {busy ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
