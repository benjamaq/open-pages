"use client"

import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

export default function HeroSleep() {
  return (
    <section className="hero-sleep">
      <div className="max-w-4xl mx-auto text-center px-6 py-16">
        <p className="text-sm text-gray-600 mb-2">For anyone who’s tired of being tired</p>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
          You deserve better sleep.<br />
          <span className="font-semibold">Let’s find out what’s in the way.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Track your sleep, daily factors, and patterns. Elli (your AI companion) shows you what’s actually affecting your rest.
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


