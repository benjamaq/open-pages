import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

export default function FinalCTA() {
  return (
    <section className="py-16 bg-blue-50">
      <div className="max-w-3xl mx-auto text-center px-6">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to sleep better?</h3>
        <p className="text-gray-600 mb-6">Track sleep and daily factors for 7-14 days. Find what's ruining your sleep — and fix it.</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signup"
            onClick={() => { try { console.log('📊 Analytics: cta_click', { page: '/sleep', cta: 'final_find_sleep_triggers' }); trackEvent('cta_click', { page: '/sleep', cta: 'final_find_sleep_triggers' }) } catch {} }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Find My Sleep Triggers
          </Link>
          <Link
            href="/pricing"
            onClick={() => { try { console.log('📊 Analytics: cta_click', { page: '/sleep', cta: 'see_pricing' }); trackEvent('cta_click', { page: '/sleep', cta: 'see_pricing' }) } catch {} }}
            className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            See Pricing
          </Link>
        </div>
      </div>
    </section>
  )
}


