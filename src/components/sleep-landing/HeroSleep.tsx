"use client"

import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

export default function HeroSleep() {
  return (
    <section className="hero-sleep">
      <div className="max-w-4xl mx-auto text-center px-6 py-16">
        <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold mb-4">
          THE NEXT GENERATION OF SLEEP TRACKING
        </p>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Can&apos;t sleep?<br />
          Find out why.
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Most sleep trackers show you <em>how</em> you slept.<br />
          Our intelligent system shows you what's disrupting your sleep — so you can fix it.
        </p>
        <div className="flex gap-4 justify-center mb-6">
          <Link
            href="/auth/signup"
            onClick={() => { try { console.log('📊 Analytics: cta_click', { page: '/sleep', cta: 'find_sleep_triggers' }); trackEvent('cta_click', { page: '/sleep', cta: 'find_sleep_triggers' }) } catch {} }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg transition-colors"
          >
            Start Tracking Sleep
          </Link>
          <a
            href="#how-it-works"
            onClick={() => { try { console.log('📊 Analytics: cta_click', { page: '/sleep', cta: 'see_how_it_works' }); trackEvent('cta_click', { page: '/sleep', cta: 'see_how_it_works' }) } catch {} }}
            className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 font-semibold py-3 px-5 rounded-lg transition-colors"
          >
            How It Works
          </a>
        </div>
        <p className="text-sm text-gray-500">
          Free · No wearable needed · 20 seconds per day
        </p>
      </div>
    </section>
  )
}


