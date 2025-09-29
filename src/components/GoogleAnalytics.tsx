'use client'

import { GoogleAnalytics as GA } from '@next/third-parties/google'

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!measurementId) {
    console.warn('Google Analytics measurement ID not found. Please set NEXT_PUBLIC_GA_MEASUREMENT_ID in your environment variables.')
    return null
  }

  return <GA gaId={measurementId} />
}
