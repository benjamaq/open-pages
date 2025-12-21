'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()
  const supabase = createClient()

  const onLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    router.push('/login')
  }

  return (
    <button
      onClick={onLogout}
      className={className || 'px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-sm'}
      aria-label="Log out"
    >
      Log out
    </button>
  )
}


