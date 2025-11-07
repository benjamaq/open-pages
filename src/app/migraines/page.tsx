import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import WhyDifferent from '@/components/sections/WhyDifferent'
import { StepsTimeline } from '@/components/StepsTimeline'

export const metadata: Metadata = {
  title: 'BioStackr: Migraines — Find Your Triggers',
  description: 'Track for 20 seconds a day. BioStackr connects the dots to find your migraine triggers — including combinations and 24–48h lags.',
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 ${className}`}>{children}</div>
}

function PrimaryCTA({ className = '' }: { className?: string }) {
  return (
    <a href="/auth/signup" className={`inline-flex items-center justify-center rounded-md bg-[#f59e0b] text-black px-8 py-4 text-lg font-bold hover:bg-[#d97706] transition ${className}`}>Start Free</a>
  )
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white text-slate-900">
      <Container>
        <div className="pt-20 md:pt-28 pb-10 md:pb-16 grid md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-7">
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight whitespace-pre-line">{`Stop Guessing Your Triggers.\nWe’ll Show You What Causes Your Migraines.`}</h1>
            <div className="mt-5 space-y-4 text-lg md:text-xl text-slate-700">
              <p>You’ve tried everything — elimination diets, new meds, strict routines — but headaches still hit out of nowhere.</p>
              <p>BioStackr finds the patterns behind your attacks — including combinations like red wine at night and 6 hours or less of sleep, and 24 to 48 hour lags from pressure drops.</p>
              <p>Track for 20 seconds a day. See useful signals in a week.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <PrimaryCTA />
              <a href="#how-it-works" className="inline-flex items-center justify-center rounded-md border-2 border-black px-8 py-4 text-base font-semibold hover:bg-black/5">See how it works</a>
            </div>
            <div className="mt-3 text-sm text-slate-600">Get started in 30 seconds - no credit card required.</div>
          </div>
          <div className="md:col-span-5">
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-full max-w-[320px] sm:max-w-[400px] rounded-xl border-l-[4px] bg-purple-50 p-6 shadow-sm" style={{ borderLeftColor: '#8b5cf6' }}>
                <div className="text-xl font-semibold text-purple-900">🍷 Red wine at night and 6 hours or less of sleep → Severity 7/10</div>
                <div className="text-[16px] text-purple-900/80 mt-1">Skip wine or sleep 7 hours or more → Severity 4/10</div>
              </div>
              <div className="w-full max-w-[320px] sm:max-w-[400px] rounded-xl border-l-[4px] bg-blue-50 p-6 shadow-sm" style={{ borderLeftColor: '#6366f1' }}>
                <div className="text-xl font-semibold text-blue-900">🌧️ Day after pressure drop → Severity 6/10</div>
                <div className="text-[16px] text-blue-900/80 mt-1">No pressure change → Severity 3/10</div>
              </div>
              <div className="w-full max-w-[320px] sm:max-w-[400px] rounded-xl border-l-[4px] bg-red-50 p-6 shadow-sm" style={{ borderLeftColor: '#ef4444' }}>
                <div className="text-xl font-semibold text-red-900">📱 Screens at night during stressful days → Severity 6/10</div>
                <div className="text-[16px] text-red-900/80 mt-1">Screens earlier and calm evenings → Severity 3/10</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default function MigrainesPage() {
  return (
    <main>
      <Hero />
      <WhyDifferentMigraine />
      <PatternShowcase />
      <TriedEverything />
      <StepsMigraine />
      <Outcomes />
      <FounderExpanded />
      <Testimonials />
      <MorePatterns />
      <Pricing />
      <FinalCTA />
    </main>
  )
}

function PatternShowcase() {
  return (
    <section className="bg-white py-20">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">A real pattern, discovered in 7 days</h2>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Missed lunch and late coffee (around 3pm)</p>
                <div className="mt-2 h-3 w-full rounded-full bg-slate-100"><div className="h-3 rounded-full bg-[#FF7A7A]" style={{ width: '70%' }} /></div>
                <p className="mt-1 text-xs text-slate-500">Higher next‑day severity</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Eat at noon and drink water; avoid late coffee</p>
                <div className="mt-2 h-3 w-full rounded-full bg-slate-100"><div className="h-3 rounded-full bg-[#34D399]" style={{ width: '35%' }} /></div>
                <p className="mt-1 text-xs text-slate-500">Reduced attacks</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">“It wasn’t just coffee”</h3>
            <p className="mt-3 text-slate-700">“I kept blaming coffee. The app showed it was really <span className="font-semibold">missing lunch and then a 3pm coffee</span>. Eat at noon and drink water? Next morning was calm. Miss lunch and grab coffee late? Headache by breakfast.”</p>
            <p className="mt-3 text-sm text-slate-500">High confidence • 9 nights</p>
            <div className="mt-6"><PrimaryCTA /></div>
          </div>
        </div>
      </Container>
    </section>
  )
}

function Outcomes() {
  return (
    <section className="bg-white py-20">
      <Container>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">What happens when you finally see patterns</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[{t:'You stop avoiding everything',d:'No more guessing if it was wine, screens, or weather. You’ll know what matters for you.'},{t:'You plan around high‑risk days',d:'Pressure drops or cycle windows? Prepare the night before and reduce severity.'},{t:'You get control back',d:'One change. One week. Fewer attacks and more normal days.'}].map(x=> (
            <div key={x.t} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
              <div className="text-emerald-600 font-bold mb-2 text-2xl">✓</div>
              <h3 className="font-semibold mb-2">{x.t}</h3>
              <p className="text-slate-600">{x.d}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function FounderExpanded() {
  return (
    <section className="bg-gray-50 py-20">
      <Container>
        <div className="grid md:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          <div className="md:col-span-5 flex justify-center">
            <Image src="/mum%20photo.png" alt="Ben and his mum" width={300} height={300} className="rounded-xl w-[240px] md:w-[300px] h-auto object-cover" />
          </div>
          <div className="md:col-span-7 text-[16px] md:text-[18px] leading-[1.8] text-slate-800">
            <h3 className="text-2xl md:text-4xl font-bold mb-4">Why I built BioStackr</h3>
            <p className="mb-3">I watched my mum wrestle with chronic pain and migraines for years. We tried everything — new meds, elimination diets, tracking apps — and somehow had <span className="font-semibold">more data and fewer answers</span>.</p>
            <p className="mb-3">Her attacks weren’t random. They were <span className="font-semibold">hidden patterns</span>: pressure drops 24–48h earlier, late nights with screens, missed meals on travel days. No app showed that. They logged pain; they didn’t explain <em>why</em>.</p>
            <p className="mb-3">So I built BioStackr to connect the dots — timing windows, combinations, and lags — in a way people can actually use. Not a diary. A guide.</p>
            <p className="italic">— Ben</p>
          </div>
        </div>
      </Container>
    </section>
  )
}

function Testimonials() {
  const items = [
    {
      name: 'Mara, 34 — Office air and missed meals',
      img: '/female 34.png',
      story: [
        "I kept thinking it was ‘food triggers’. BioStackr kept pointing at two things that always showed up together: I’d skip lunch on meeting days and then inhale a coffee at 3pm.",
        "When I actually ate at noon and drank water, the afternoon coffee wasn’t a problem. If I missed lunch and had coffee later, a migraine showed up the next morning almost every time.",
        "It sounds boring, but that was the quiet pattern I never saw. Now I block 20 minutes for food and it’s… calmer.",
      ],
    },
    {
      name: 'Jon, 38 — Pressure drops and late nights',
      img: '/male 38.png',
      story: [
        "Weather apps felt like superstition. The app kept labeling ‘storm days’. It wasn’t the rain — it was the drop the day before, plus me staying up late on my laptop.",
        "On those days I moved bedtime earlier and hit water hard. Severity went from 7/10 to around 4/10. Not magic, just planning.",
        "Seeing the 24 to 48 hour lag was the part my brain couldn’t do on its own.",
      ],
    },
    {
      name: 'Nina, 34 — Fragrance and cycle window',
      img: '/female 34.png',
      story: [
        "My ‘random’ days started to line up with two things: strong fragrance in our open‑plan office and the two days before my period.",
        "I moved to a desk near a window and asked the team to skip sprays on meeting days. That alone cut the worst days nearly in half.",
        "It wasn’t about living perfectly. It was knowing when I needed to protect the edges.",
      ],
    },
  ]
  return (
    <section className="bg-slate-50/60 py-20">
      <Container>
        <h2 className="text-3xl font-bold text-slate-900">Built for people who’ve already tried everything</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {items.map((t) => (
            <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
              </div>
              <div className="mt-4 space-y-3 text-slate-700 leading-relaxed">
                {t.story.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8"><PrimaryCTA /></div>
      </Container>
    </section>
  )
}

function Pricing() {
  return (
    <section className="bg-white py-20" id="pricing">
      <Container>
        <h2 className="text-3xl font-bold text-slate-900">Start free. Upgrade when you’re ready.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Free</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">$0 <span className="text-base font-medium text-slate-500">/ month</span></p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>✓ 20‑second daily check‑ins</li>
              <li>✓ First pattern (7–14 days)</li>
              <li>✓ Privacy by default</li>
            </ul>
            <div className="mt-6"><a href="/auth/signup" className="inline-flex rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50">Start Free</a></div>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Premium</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">$29 <span className="text-base font-medium text-slate-500">/ month</span></p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>✓ Everything in Free</li>
              <li>✓ Add more context (unlimited items & tags)</li>
            </ul>
            <a href="/auth/signup/pro" className="mt-6 inline-flex rounded-xl bg-[#F4B860] px-5 py-3 font-semibold text-slate-900 hover:bg-[#E5A850]">Start Premium →</a>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">No credit card for Free. Cancel anytime.</p>
      </Container>
    </section>
  )
}

function MorePatterns() {
  const items = [
    { title: 'Pressure drop window', before: 'a drop of 5 hPa or more yesterday', after: 'Today: Severity 6/10', note: 'Prep on “storm” days: hydrate, earlier lights‑out, calmer mornings.', confidence: 'High confidence' },
    { title: 'Missed lunch and late coffee', before: 'Skipped lunch and had coffee around 3pm', after: 'Severity 7/10', note: 'Eat lunch and drink water — severity around 4/10 the next day. Timing matters.', confidence: 'Moderate confidence' },
    { title: 'Histamine delay (24 to 36 hours)', before: 'Aged cheese or leftovers from the day before yesterday', after: 'Severity 6/10 the next day', note: 'Fresh meals or lower‑histamine choices lowered severity to about 3/10.', confidence: 'Moderate confidence' },
    { title: 'Neck tension after long drive', before: 'Two hours of driving without breaks', after: 'Severity 5/10 the same evening', note: 'Midday neck mobility and heat led to attacks dropping to 2/10.', confidence: 'High confidence' },
    { title: 'Strong fragrance exposure', before: 'Heavy perfume during a meeting', after: 'Severity 6/10', note: 'Moving seats and taking a fresh‑air break reduced severity to about 3/10.', confidence: 'Moderate confidence' },
  ]
  return (
    <section className="bg-white py-20">
      <Container>
        <h2 className="text-3xl font-bold text-slate-900">More patterns BioStackr uncovers</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {items.map((d) => (
            <div key={d.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{d.title}</h3>
              <div className="mt-3 text-slate-700 text-sm"><span className="font-medium">Before:</span> {d.before}</div>
              <div className="text-slate-700 text-sm"><span className="font-medium">After:</span> {d.after}</div>
              <p className="mt-3 text-slate-600">{d.note}</p>
              <p className="mt-2 text-xs text-slate-500">{d.confidence}</p>
            </div>
          ))}
        </div>
        <div className="mt-8"><PrimaryCTA /></div>
      </Container>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 py-20 text-white">
      <Container>
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Stop living around your migraines</h2>
          <p className="mt-3 text-white/90">Start today — most people see usable patterns in 7–14 days.</p>
          <PrimaryCTA className="mt-6" />
        </div>
      </Container>
    </section>
  )
}

function WhyDifferentMigraine() {
  return (
    <section className="bg-gray-50 py-20 px-8">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6">💡 Why BioStackr is different</div>
        <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">Not just another health tracker</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">Most apps log headaches. We connect the dots.</p>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">They show a diary. We show what actually triggers <span className="font-semibold">your</span> attacks.</p>
        <div className="bg-white rounded-2xl shadow-lg max-w-4xl mx-auto p-12 text-left">
          <h3 className="text-2xl font-bold text-black mb-8">BioStackr is different:</h3>
          <ul className="space-y-6">
            {[
              'AI that explains why your migraines start',
              'Clear insights you can use to change tomorrow',
              'No overwhelm. Just answers.',
              'Simple 20‑second daily check‑ins',
            ].map((t)=> (
              <li key={t} className="text-xl font-semibold text-black">✅ {t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function StepsMigraine() {
  const steps = [
    { number: '1', icon: '✍️', title: 'Log — 20 seconds', description: 'Rate severity (0–10). Note symptoms (aura, nausea), and what changed: sleep, food, stress, screens, weather.' },
    { number: '2', icon: '🧠', title: 'We connect the dots', description: 'Find timing windows, combinations, and lags: pressure drops (24 to 48 hours), histamine delay (24 to 36 hours), missed meals and late coffee.' },
    { number: '3', icon: '💡', title: 'You get a next step', description: 'Try the change for 5 days. If it helps, lock it in. One pattern. One week. Fewer attacks.' },
  ]
  return (
    <section id="how-it-works" className="bg-white py-20">
      <Container>
        <div className="text-center mb-4">
          <p className="text-lg text-gray-600 mb-2">It only takes 20 seconds a day to discover your triggers</p>
          <h2 className="text-3xl md:text-4xl font-bold">Three steps. One week. Clear answers.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto place-items-center md:place-items-stretch">
          {steps.map((s) => (
            <div key={s.number} className="w-full max-w-[360px] text-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="w-20 h-20 bg-[#F4B860]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">{s.icon}</div>
              <div className="text-3xl font-bold text-[#F4B860] mb-3">{s.number}</div>
              <h3 className="text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-gray-600 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center"><PrimaryCTA /></div>
      </Container>
    </section>
  )
}

function TriedEverything() {
  return (
    <section className="bg-white py-20">
      <Container>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">You’ve tried everything. Nothing worked.</h2>
          <div className="text-[20px] leading-[1.6] text-slate-700 space-y-4">
            <p>Some weeks one thing helps. The next week the same thing does nothing. You’re not crazy — your triggers are timing‑ and context‑dependent.</p>
            <p>BioStackr tests <span className="font-semibold">when</span> and <span className="font-semibold">what‑with‑what</span>: missed meals + caffeine, pressure drops before today, stress + screens at night, cycle windows.</p>
            <p>We don’t show charts. We show what to try tonight.</p>
          </div>
        </div>
      </Container>
    </section>
  )
}
