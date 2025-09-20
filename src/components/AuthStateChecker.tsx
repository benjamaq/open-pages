'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'

interface AuthStateCheckerProps {
  serverIsOwner: boolean
  profileSlug: string
  children: (isOwner: boolean) => React.ReactNode
}

export default function AuthStateChecker({ 
  serverIsOwner, 
  profileSlug, 
  children 
}: AuthStateCheckerProps) {
  const [clientIsOwner, setClientIsOwner] = useState(serverIsOwner)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          setClientIsOwner(false)
          setIsChecking(false)
          return
        }

        // Get current user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('slug')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profile) {
          setClientIsOwner(false)
        } else {
          setClientIsOwner(profile.slug === profileSlug)
        }
      } catch (err) {
        console.log('Client auth check error:', err)
        setClientIsOwner(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuthState()
  }, [profileSlug])

  if (isChecking) {
    return children(serverIsOwner) // Use server state while checking
  }

  return children(clientIsOwner)
}
