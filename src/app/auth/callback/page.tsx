'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (error) {
          router.replace('/login')
          return
        }
        if (data?.session) {
          try { localStorage.setItem('supabase_session', JSON.stringify(data.session)) } catch {}
          router.replace('/dashboard')
        } else {
          router.replace('/login')
        }
      } catch {
        router.replace('/login')
      }
    }
    run()
  }, [router])
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-sm text-gray-600">Signing you in…</div>
    </div>
  )
}


