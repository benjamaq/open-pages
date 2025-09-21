'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthCheckProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function AuthCheck({ children, redirectTo = '/auth/signin' }: AuthCheckProps) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push(redirectTo)
        return
      }
      
      setUser(user)
      setLoading(false)
    }

    checkAuth()
  }, [router, redirectTo, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h1 className="text-xl font-medium text-gray-900 mb-2">Checking authentication...</h1>
          <p className="text-gray-600">Please wait a moment</p>
        </div>
      </div>
    )
  }

  return user ? <>{children}</> : null
}
