'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <Link 
          href="/dash" 
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Dashboard
        </Link>
        <button
          onClick={handleSignOut}
          className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <Link 
      href="/auth/signin" 
      className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
    >
      Sign In
    </Link>
  )
}
