"use client"

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import HeroSleep from '@/components/sleep-landing/HeroSleep'
import SocialProofBar from '@/components/sleep-landing/SocialProofBar'
import WhyDifferent from '@/components/sleep-landing/WhyDifferent'
import PatternExamples from '@/components/sleep-landing/PatternExamples'
import HowItWorks from '@/components/sleep-landing/HowItWorks'
import SuccessStories from '@/components/sleep-landing/SuccessStories'
import Pricing from '@/components/sleep-landing/Pricing'
import FAQ from '@/components/sleep-landing/FAQ'
import FinalCTA from '@/components/sleep-landing/FinalCTA'

export default function SleepLandingClient() {
  useEffect(() => {
    try {
      console.log('📊 Analytics: page_view', { page: '/sleep' })
      trackEvent('page_view', { page: '/sleep' })
    } catch {}

    const thresholds = [25, 50, 75, 100]
    const seen: Record<number, boolean> = {}
    const onScroll = () => {
      const scrolled = ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
      thresholds.forEach(t => {
        if (!seen[t] && scrolled >= t) {
          seen[t] = true
          try {
            console.log('📊 Analytics: scroll_depth', { page: '/sleep', depth: t })
            trackEvent('scroll_depth', { page: '/sleep', depth: t })
          } catch {}
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <HeroSleep />
      <SocialProofBar />
      <WhyDifferent />
      <PatternExamples />
      <HowItWorks />
      <SuccessStories />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </div>
  )
}


