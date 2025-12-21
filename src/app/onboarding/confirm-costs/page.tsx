'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmCostsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/onboarding/alignment-reveal')
  }, [router])
  return null
}


