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
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <p className="tracking-wide text-gray-900 font-light text-2xl md:text-3xl">Pattern Discovery for Your Health</p>
          </div>
        </div>
      </section>
    </main>
  )
}



