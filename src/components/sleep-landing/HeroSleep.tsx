"use client"

import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

export default function HeroSleep() {
  return (
    <section className="hero-sleep">
      <div className="max-w-4xl mx-auto text-center px-6 py-16">
        <p className="text-sm uppercase tracking-wide text-blue-600 mb-2">
          THE NEXT GENERATION OF SLEEP TRACKING
        </p>
        <p className="text-lg text-gray-600 mb-4 font-medium">
          Meet Elli, your AI sleep companion 💙
        </p>
        <h1 className="text-6xl md:text-7xl font-black mb-6 text-gray-900">
          Can't sleep?<br />
          Find out why.
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Most sleep trackers show you <em>how</em> you slept.<br />
          BioStackr's intelligent system shows you what's disrupting your sleep — so you can fix it.
        </p>
        <div className="flex gap-4 justify-center mb-6">
          <Link
            href="/auth/signup"
            onClick={() => { try { console.log('📊 Analytics: cta_click', { page: '/sleep', cta: 'find_sleep_triggers' }); trackEvent('cta_click', { page: '/sleep', cta: 'find_sleep_triggers' }) } catch {} }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg transition-colors"
          >
            Find My Sleep Triggers
          </Link>
          <a
            href="#how-it-works"
            onClick={() => { try { console.log('📊 Analytics: cta_click', { page: '/sleep', cta: 'see_how_it_works' }); trackEvent('cta_click', { page: '/sleep', cta: 'see_how_it_works' }) } catch {} }}
            className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 font-semibold py-3 px-5 rounded-lg transition-colors"
          >
            See How It Works
          </a>
        </div>
        <p className="text-sm text-gray-500">
          Free to start · No credit card · Setup in 20 seconds
        </p>
      </div>
    </section>
  )
}


