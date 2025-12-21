'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingUploadRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/onboarding/wearables')
  }, [router])
  return null
}


