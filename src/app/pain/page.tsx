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
    // Swap hero headline to a more positive variant (A/B tested)
    staticHtml = staticHtml.replace(/You[’']ve tried everything to manage your pain\./, 'Find what’s working for your pain.')
    staticHtml = staticHtml.replace(/You\'ve tried everything to manage your pain\./, 'Find what’s working for your pain.')
  } catch {}
  return (
    <main>
      {staticHtml ? (
        <section className="bg-white">
          {/* Hide the static page's own header/navigation and trust badges; tighten hero spacing */}
          <style>{`
            .site-header{display:none !important}
            .below-nav{display:none !important}
            .pain-embed .section-label{display:none !important}
            .pain-embed .section-label + span{display:none !important}
            .pain-embed section:first-of-type{padding-top:20px !important}
            /* Remove PWA Install section */
            .pain-embed #install{display:none !important}
            /* Add clear spacing between Founder Story and In Their Words sections */
            .pain-embed section[style="background: #f8f9fa; padding: 80px 20px; overflow: hidden;"]{
              margin-top: 48px !important;
              padding-top: 96px !important;
            }
            /* Mobile iPhone SE tweaks for hero sizing & CTAs */
            @media (max-width: 375px){
              .pain-embed .hero-title{ font-size: 28px !important; line-height: 1.25 !important; }
              .pain-embed .hero-subtitle{ font-size: 14px !important; }
              .pain-embed [id='cta-signup']{ padding: 8px 12px !important; font-size: 13px !important; border-radius: 8px !important; }
              .pain-embed a[href="#how-it-works"]{ padding: 8px 12px !important; font-size: 13px !important; border-radius: 8px !important; }
            }
          `}</style>
          <div className="container mx-auto px-4 py-4">
            <div className="prose max-w-none w-full pain-embed" dangerouslySetInnerHTML={{ __html: staticHtml }} />
          </div>
        </section>
      ) : null}
      {/* Pain page ends after embedded content */}
    </main>
  )
}




