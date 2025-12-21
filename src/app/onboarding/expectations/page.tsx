'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ExpectationsOnboarding() {
  const router = useRouter()
  useEffect(() => {
    // Immediately forward to the single post-upload screen
    router.replace('/onboarding/report-ready')
  }, [router])
  return null
}

