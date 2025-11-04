import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'BioStackr: Pattern Discovery for Chronic Pain',
  description: 'Track pain, mood, and sleep. Tag what you try. BioStackr discovers patterns that help you take action.',
}

export default function PainPage() {
  const staticPath = path.join(process.cwd(), 'public', 'landing-v2.html')
  let staticHtml = ''
  try {
    staticHtml = fs.readFileSync(staticPath, 'utf8')
  } catch {}
  return (
    <main>
      <section className="bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold leading-tight mb-6 text-gray-900">Decode Your Chronic Pain Patterns</h1>
            <p className="text-lg text-gray-700 mb-4">Your body knows what triggers flares and what brings relief.</p>
            <p className="text-lg text-gray-700 mb-8">BioStackr discovers those patterns so you can take action.</p>
            <Link href="/auth/signup" className="inline-flex items-center rounded-md bg-indigo-500 px-6 py-3 text-white font-semibold hover:bg-indigo-600">Start Pain Discovery →</Link>
          </div>
        </div>
      </section>
      {staticHtml ? (
        <section className="bg-white">
          <style>{`.site-header{display:none !important}`}</style>
          <div className="container mx-auto px-4 py-8">
            <div className="prose max-w-none w-full" dangerouslySetInnerHTML={{ __html: staticHtml }} />
          </div>
        </section>
      ) : null}
    </main>
  )
}


