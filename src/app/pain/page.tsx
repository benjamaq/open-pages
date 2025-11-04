import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'BioStackr: Pattern Discovery for Chronic Pain',
  description: 'Track pain, mood, and sleep. Tag what you try. BioStackr discovers patterns that help you take action.',
}

export default function PainPage() {
  // Restore existing chronic pain landing content from static HTML
  const staticPath = path.join(process.cwd(), 'public', 'landing-v2.html')
  let staticHtml = ''
  try {
    staticHtml = fs.readFileSync(staticPath, 'utf8')
  } catch {}
  return (
    <main>
      <section className="bg-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <p className="tracking-wide text-gray-900 font-light text-2xl md:text-3xl">Pattern Discovery for Your Health</p>
          </div>
        </div>
      </section>
      {staticHtml ? (
        <section className="bg-white">
          {/* Hide the static page's own header/navigation to avoid duplication */}
          <style>{`.site-header{display:none !important}`}</style>
          <div className="container mx-auto px-4 py-8">
            <div className="prose max-w-none w-full" dangerouslySetInnerHTML={{ __html: staticHtml }} />
          </div>
        </section>
      ) : null}
    </main>
  )
}




