import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'BioStackr: Pattern Discovery for Chronic Pain',
  description: 'Track pain, mood, and sleep. Tag what you try. BioStackr discovers patterns that help you take action.',
}

export default function PainPage() {
  return (
    <main>
      <section className="bg-white">
        <div className="container mx-auto px-4 py-24 md:py-36 min-h-[70vh] flex items-center">
          <div className="max-w-3xl mx-auto text-center">
            <p className="tracking-wide text-gray-900 font-light text-2xl md:text-3xl mb-4">Pattern Discovery for Your Health</p>
            <p className="text-gray-600 text-lg md:text-xl mb-8">Track pain, mood, and what you try. We'll find why flares happen—and what actually helps.</p>
            <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-full bg-[#F4B860] px-6 py-3 text-base font-semibold text-[#2C2C2C] hover:bg-[#E5A850] transition-colors">Start Pain Discovery →</Link>
          </div>
        </div>
      </section>
    </main>
  )
}



