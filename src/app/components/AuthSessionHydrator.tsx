'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthSessionHydrator() {
  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createClient()
        // If Supabase already has a session, nothing to do
        const { data: current } = await supabase.auth.getSession()
        if (current?.session) return
        const raw = localStorage.getItem('supabase_session')
        if (!raw) return
        const session = JSON.parse(raw)
        if (!session?.access_token || !session?.refresh_token) return
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
      } catch {}
    }
    run()
  }, [])
  return null
}


