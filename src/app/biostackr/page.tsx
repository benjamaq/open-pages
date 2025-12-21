'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sora, Inter } from 'next/font/google'

const display = Sora({ subsets: ['latin'], weight: ['600','700','800'], variable: '--font-display' })
const body = Inter({ subsets: ['latin'], weight: ['400','500','700'], variable: '--font-body' })

export default function BioStackrLandingPage() {
  const [spend, setSpend] = useState<number>(247)
  const [animLow, setAnimLow] = useState<number>(Math.round(spend * 0.4))
  const [animHigh, setAnimHigh] = useState<number>(Math.round(spend * 0.6))
  const [animLowYear, setAnimLowYear] = useState<number>(animLow * 12)
  const [animHighYear, setAnimHighYear] = useState<number>(animHigh * 12)
  const animRef = useRef<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  const monthly = spend
  const lowWasted = Math.round(monthly * 0.40)
  const highWasted = Math.round(monthly * 0.60)
  const lowYear = lowWasted * 12
  const highYear = highWasted * 12

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const duration = 500
    const start = performance.now()
    const from = { low: animLow, high: animHigh, lowY: animLowYear, highY: animHighYear }
    const to = { low: lowWasted, high: highWasted, lowY: lowYear, highY: highYear }
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const ease = 1 - Math.pow(1 - p, 3)
      setAnimLow(Math.round(from.low + (to.low - from.low) * ease))
      setAnimHigh(Math.round(from.high + (to.high - from.high) * ease))
      setAnimLowYear(Math.round(from.lowY + (to.lowY - from.lowY) * ease))
      setAnimHighYear(Math.round(from.highY + (to.highY - from.highY) * ease))
      if (p < 1) {
        animRef.current = requestAnimationFrame(tick)
      }
    }
    animRef.current = requestAnimationFrame(tick)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [lowWasted, highWasted, lowYear, highYear]) // animate when values change

  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'truth', label: 'Truth' },
    { id: 'speed', label: 'Speed' },
    { id: 'how', label: 'How it works' },
    { id: 'profiles', label: 'Profiles' },
    { id: 'ick', label: 'The ick' },
    { id: 'calculator', label: 'Calculator' },
    { id: 'science', label: 'Science' },
    { id: 'exes', label: 'Hall of Exes' },
    { id: 'who', label: 'Who it’s for' },
    { id: 'pricing', label: 'Pricing' },
  ]

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`${display.variable} ${body.variable} min-h-screen bg-[var(--bg-dark)] text-[var(--text-light)]`} style={{ fontFamily: 'var(--font-body)' }}>
      <style jsx global>{`
        :root{
          --brand-primary:#0D9488;
          --bg-dark:#0F0F0F;
          --bg-charcoal:#1A1A1A;
          --bg-slate:#2D2D2D;
          --bg-warm:#FAF8F5;
          --bg-white:#FFFFFF;
          --accent-silver:#A3A3A3;
          --accent-purple:#8B5CF6;
          --accent-green:#10B981;
          --accent-red:#EF4444;
          --accent-amber:#F59E0B;
          --text-light:#FFFFFF;
          --text-muted-light:#A3A3A3;
          --text-dark:#1A1A1A;
          --text-muted-dark:#6B7280;
        }
        ::selection{ background: rgba(139,92,246,0.25); color: #fff }
        html{ scroll-behavior: smooth }
        .grain{ position:absolute; inset:0; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.05"/></svg>'); pointer-events:none; }
        @keyframes float { 0%{ transform: translateY(0px)} 50%{ transform: translateY(-10px)} 100%{ transform: translateY(0px)} }
        .float{ animation: float 6s ease-in-out infinite }
        .hover-card{ transition: transform .25s ease, box-shadow .25s ease }
        .hover-card:hover{ transform: translateY(-4px) rotate(-0.4deg); box-shadow: 0 20px 40px rgba(0,0,0,0.08) }
        h1,h2,h3,h4{ font-family: var(--font-display); letter-spacing: -0.02em }
      `}</style>

      {/* Sticky Nav */}
      <header className={`sticky top-0 z-50 ${scrolled ? 'bg-[var(--bg-dark)]/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'} transition`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" className="flex items-center gap-2">
            <img src="/BIOSTACKR LOGO 2.png" alt="BioStackr" className="h-7 w-auto brightness-125" />
            <span className="sr-only">BioStackr</span>
          </a>
          <nav className="hidden md:flex items-center gap-5 text-sm text-white">
            {navItems.map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)} className="text-[var(--text-muted-light)] hover:text-white">
                {n.label}
              </button>
            ))}
          </nav>
          <a
            href="/onboarding"
            className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-[var(--bg-dark)] shadow hover:shadow-lg hover:scale-[1.02] transition"
          >
            Get My Breakup Report
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* HERO */}
        <section id="hero" className="relative overflow-hidden py-28 md:py-40 rounded-3xl mt-6 bg-[var(--bg-dark)] text-white">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--accent-purple)]/20 blur-3xl float" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[var(--accent-green)]/10 blur-3xl float" style={{ animationDelay: '1.2s' }} />
          <div className="grain" />
          <div className="relative z-10 max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-green)]">Tinder</span> for Your Supplements.
            </h1>
            <p className="mt-4 text-xl text-[var(--text-muted-light)]">Swipe right on what works. Break up with what doesn't.</p>
            <div className="mt-6 space-y-4 text-[var(--accent-silver)] leading-relaxed">
              <p>You're in a relationship with a dozen supplements. But how many are actually working for you?</p>
              <p>BioStackr tracks your real-world patterns to show you what actually works. And if you use a wearable, it helps us read the signs even faster.</p>
              <p>No judgment. Just clarity.</p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              <a href="/onboarding" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-[var(--bg-dark)] shadow-md hover:shadow-lg hover:scale-[1.02] transition">
                Get My Breakup Report
              </a>
              <div className="text-sm text-[var(--text-muted-light)]">Free to start. Upload data from any wearable — or just check in daily.</div>
            </div>
          </div>
        </section>

        {/* THE UNCOMFORTABLE TRUTH */}
        <section id="truth" className="py-24 bg-[var(--bg-warm)] text-[var(--text-dark)] rounded-3xl mt-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold">The Uncomfortable Truth</h2>
            <p className="mt-1 text-[var(--text-muted-dark)]">Let's talk about your situationship with ashwagandha.</p>
            <div className="mt-6 space-y-4 text-[var(--text-dark)]">
              <p>You've been taking it for six months. You've spent €234. You think it's helping. But you've never been sure.</p>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl transition">
                <p className="text-xl"><span className="font-extrabold">65–75%</span> of supplements show no measurable effect in the people taking them.</p>
              </div>
              <p>Your daily patterns — sleep, energy, focus, mood — already hold the answers. We help you read them.</p>
            </div>
          </div>
        </section>

        {/* SPEED TO VALUE */}
        <section id="speed" className="py-24 bg-[var(--bg-charcoal)] text-white rounded-3xl mt-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold">See signals from day one.</h2>
              <div className="mt-4 space-y-3 text-[var(--text-muted-light)]">
                <p>Upload your wearable data? We start analyzing immediately.</p>
                <p>No wearable? Your first check-in takes 30 seconds — and your dashboard starts building from there.</p>
                <p>This isn't a 6-month science experiment. Within 2 weeks, you'll have your first real answers.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 p-8 shadow-lg relative overflow-hidden">
              <div className="absolute -top-10 -right-10 h-32 w-32 bg-[var(--accent-purple)]/20 blur-2xl rounded-full" />
              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-white" />
              </div>
              <p className="mt-3 text-sm text-[var(--text-muted-light)]">Progress builds with each clean day.</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="py-24 bg-[var(--bg-warm)] text-[var(--text-dark)] rounded-3xl mt-8">
          <h2 className="text-3xl font-bold">How to find the one(s)</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Step num={1} title="Add your supplements" body="All of them. Even the impulsive podcast purchases." />
            <Step num={2} title="Check in daily" body="30 seconds. Rate your mood, energy, focus. Flag anything unusual." />
            <Step num={3} title="We check for chemistry" body="Real statistics: effect sizes, confidence intervals, timelines. Science, not vibes." />
            <Step num={4} title="See your compatibility evolve" body="Every supplement gets a score that updates as you check in. Keep, Drop, or It's Complicated." />
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted-dark)]">Use a wearable? Upload your data to speed things up.</p>
        </section>

        {/* DATING PROFILES */}
        <section id="profiles" className="py-24 bg-[var(--bg-slate)] text-white rounded-3xl mt-8">
          <h2 className="text-3xl font-bold">Your supplements get dating profiles.</h2>
          <div className="mt-8 overflow-x-auto">
            <div className="flex gap-6 min-w-full">
              <ProfileCard name="Ashwagandha" compat={19} color="red" duration="6 months • €234 spent" line1="No chemistry. Your sleep didn't budge." badge="Drop" />
              <ProfileCard name="Magnesium Glycinate" compat={91} color="green" duration="8 months • €156 spent" line1="Deep sleep +14%. Energy +8%. Real connection." badge="Keep" />
              <ProfileCard name="Lion's Mane" compat={0} color="amber" duration="3 weeks • €47 spent" line1="Still in the talking stage. Not enough data yet." badge="It's Complicated" showUnknown />
              <ProfileCard name="CBD Gummies" compat={12} color="red" duration="4 months • €316 spent" line1="Love-bombed your wallet. Ghosted your biomarkers." badge="Drop" />
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--text-muted-light)]">Swipe on mobile to browse.</p>
        </section>

        {/* THE ICK */}
        <section id="ick" className="py-24 bg-[var(--bg-charcoal)] text-white rounded-3xl mt-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-charcoal)] to-[#221a3a]" />
          <div className="grain" />
          <div className="relative z-10 rounded-3xl p-8 border border-white/10 shadow-lg">
            <h2 className="text-3xl font-bold">Some supplements give your body the ick.</h2>
            <div className="mt-4 space-y-3 text-[var(--text-muted-light)]">
              <p>Not just 'no effect' — actively negative.</p>
              <p>BioStackr flags supplements that correlate with:</p>
              <ul className="list-disc pl-6">
                <li>Worse sleep</li>
                <li>Lower energy</li>
                <li>Reduced focus</li>
                <li>Increased stress</li>
              </ul>
              <p>The same supplement from one brand might work. From another? Nothing. Or worse.</p>
              <p>That influencer who swore it changed their life? They got paid to say that. Your biology doesn't care about sponsorship deals.</p>
              <p>BioStackr helps you find the good ones. And break up with the bad.</p>
            </div>
          </div>
        </section>

        {/* CALCULATOR */}
        <section id="calculator" className="py-24 bg-[var(--bg-warm)] text-[var(--text-dark)] rounded-3xl mt-8">
          <h2 className="text-3xl font-bold">How much are you spending on supplements that don't love you back?</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2 md:items-start">
            <div>
              <label className="text-sm font-medium text-[var(--text-muted-dark)]">Estimate your monthly supplement spend</label>
              <div className="mt-4">
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={1}
                  value={spend}
                  onChange={(e) => setSpend(Number(e.target.value))}
                  className="w-full accent-[var(--accent-purple)]"
                />
                <div className="mt-2 text-sm text-[var(--text-dark)]">€{spend.toLocaleString()}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl transition">
              <p className="text-[var(--text-dark)]">
                Based on research, <span className="font-semibold">40–60%</span> of supplements show no measurable effect.
              </p>
              <p className="mt-2 text-[var(--text-dark)]">
                That's potentially <span className="font-semibold">€{animLow.toLocaleString()}–€{animHigh.toLocaleString()}/month</span> on one-sided relationships.
              </p>
              <p className="mt-2 text-[var(--text-dark)]">
                <span className="font-semibold">€{animLowYear.toLocaleString()}–€{animHighYear.toLocaleString()}/year</span> on supplements that aren't doing anything.
              </p>
              <a href="/onboarding" className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[var(--bg-dark)] px-5 text-sm font-semibold text-white shadow hover:shadow-lg hover:scale-[1.02] transition">
                Find out which ones →
              </a>
            </div>
          </div>
        </section>

        {/* CREDIBILITY */}
        <section id="science" className="py-24 bg-[var(--bg-dark)] text-white rounded-3xl mt-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <div className="grain" />
          <h2 className="text-3xl font-bold relative z-10">The science behind the breakups</h2>
          <ul className="mt-6 grid gap-3 text-white/90 sm:grid-cols-2 relative z-10">
            <li className="rounded-2xl border border-white/10 p-4 shadow hover:shadow-lg transition">Effect detection using Cohen's d (same method used in clinical trials)</li>
            <li className="rounded-2xl border border-white/10 p-4 shadow hover:shadow-lg transition">Bootstrap confidence intervals for statistical reliability</li>
            <li className="rounded-2xl border border-white/10 p-4 shadow hover:shadow-lg transition">Pattern recognition across mood, energy, focus, and sleep</li>
            <li className="rounded-2xl border border-white/10 p-4 shadow hover:shadow-lg transition">Noise filtering for alcohol, travel, stress, illness</li>
          </ul>
          <p className="mt-4 text-sm text-[var(--text-muted-light)] relative z-10">No wellness fluff. No influencer hype. No paid partnerships. Just statistics — and clarity you can act on.</p>
        </section>

        {/* HALL OF EXES */}
        <section id="exes" className="py-24 bg-[var(--bg-charcoal)] text-white rounded-3xl mt-8">
          <h2 className="text-3xl font-bold">The Supplement Hall of Exes</h2>
          <p className="text-[var(--text-muted-light)]">A memorial to what users finally let go of.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <ExCard title="Ashwagandha" line1="Promised calm. Delivered nothing." meta="7 months together • €196 wasted" foot=" " />
            <ExCard title="Vitamin D (overdosed)" line1="Thought more was better. It wasn't." meta="5 months together • €89 wasted" foot="Red flag: Negative impact on sleep" />
            <ExCard title="Random Greens Powder" line1="Looked healthy. Tasted like lawn. Did nothing." meta="4 months together • €312 wasted" foot="“I wanted to believe.”" />
          </div>
          <p className="mt-3 text-sm text-[var(--text-muted-light)]">Your exes may vary. Everything depends on your data.</p>
        </section>

        {/* WHO IT'S FOR */}
        <section id="who" className="py-24 bg-[var(--bg-warm)] text-[var(--text-dark)] rounded-3xl mt-8">
          <h2 className="text-3xl font-bold">Who it’s for</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-6 shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold">This is for you if:</h3>
              <ul className="mt-2 list-disc pl-6 text-[var(--text-dark)]">
                <li>You spend €100+/month on supplements</li>
                <li>You're tired of "I think it helps?"</li>
                <li>You want proof, not promises</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6 shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold">This isn't for you if:</h3>
              <ul className="mt-2 list-disc pl-6 text-[var(--text-dark)]">
                <li>You prefer faith-based supplementation</li>
                <li>You're not ready for the truth</li>
              </ul>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-24 bg-[var(--bg-slate)] text-white rounded-3xl mt-8">
          <h2 className="text-3xl font-bold">Ready to stop settling?</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition bg-gradient-to-br from-[#1f1f1f] to-[#2b2b2b] border border-white/10">
              <h3 className="text-xl font-semibold">FREE — <span className="text-[var(--text-muted-light)]">First Date</span></h3>
              <ul className="mt-3 space-y-1 text-white/90">
                <li>• Add your supplements</li>
                <li>• Daily check-ins</li>
                <li>• See your compatibility overview</li>
                <li>• Upload wearable data (optional)</li>
              </ul>
              <a href="/onboarding" className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[var(--bg-dark)] shadow hover:shadow-lg">Get Started Free</a>
            </div>
            <div className="rounded-2xl p-6 shadow-xl hover:shadow-2xl transition bg-gradient-to-br from-[#2b2b2b] to-[#3a2f5e] border border-white/10">
              <h3 className="text-xl font-semibold">PRO — €9/month — <span className="text-[var(--text-muted-light)]">Get Serious</span></h3>
              <ul className="mt-3 space-y-1 text-white/90">
                <li>• Full compatibility tracking</li>
                <li>• Red flag detection (negative effects)</li>
                <li>• Stack economics (what you're wasting)</li>
                <li>• Priority analysis</li>
              </ul>
              <a href="/onboarding" className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[var(--bg-dark)] shadow hover:shadow-lg hover:scale-[1.02] transition">Start Pro</a>
              <p className="mt-2 text-xs text-[var(--text-muted-light)]">Cancel anytime. No hard feelings.</p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="final-cta" className="py-24 bg-[var(--bg-dark)] text-white rounded-3xl mt-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#121212] to-[#1d1d1d] p-8 border border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute -bottom-16 -right-16 h-64 w-64 bg-[var(--accent-purple)]/20 blur-3xl rounded-full" />
            <h2 className="text-3xl font-bold relative z-10">Your stack deserves a reality check.</h2>
            <div className="mt-4 space-y-4 text-white/90 relative z-10">
              <p>You've been committed to your supplements for months. Time to find out which ones actually deserve you.</p>
              <a href="/onboarding" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-[var(--bg-dark)] shadow-md hover:shadow-lg hover:scale-[1.02] transition">
                Get My Breakup Report
              </a>
              <p className="text-sm text-[var(--text-muted-light)]">Stop dating supplements that aren't into you.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Step({ num, title, body }: { num: number; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition hover-card bg-white">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] border border-[var(--accent-purple)]/20 text-sm font-semibold">{num}</div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-[var(--text-dark)]">{body}</p>
    </div>
  )
}

function ProfileCard({ name, compat, color, duration, line1, badge, showUnknown }: { name: string; compat: number; color: 'red'|'green'|'amber'; duration: string; line1: string; badge: string; showUnknown?: boolean }) {
  const colorMap = {
    red: { text: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200' },
    green: { text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    amber: { text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  }[color]
  return (
    <div className="min-w-[260px] max-w-[320px] rounded-2xl border border-white p-5 bg-white shadow-xl hover:shadow-[0_0_40px_rgba(139,92,246,0.2)] transition hover-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[var(--accent-purple)]/10 flex items-center justify-center text-[var(--accent-purple)]">💊</div>
          <h3 className="text-lg font-semibold">{name}</h3>
        </div>
        <span className={`text-xs rounded-full border px-2 py-0.5 ${colorMap.badge}`}>{badge}</span>
      </div>
      <div className={`mt-3 text-4xl font-extrabold ${colorMap.text}`}>{showUnknown ? '???' : `${compat}%`}</div>
      <div className="mt-1 text-sm text-[var(--text-muted-dark)]">{duration}</div>
      <p className="mt-3 text-[var(--text-dark)]">{line1}</p>
    </div>
  )
}

function ExCard({ title, line1, meta, foot }: { title: string; line1: string; meta: string; foot?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#232323] p-5 text-white shadow hover:shadow-lg transition">
      <div className="text-2xl">🪦</div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-gray-200">{line1}</p>
      <div className="mt-2 text-sm text-red-400">{meta}</div>
      {foot && <div className="mt-2 text-sm text-gray-200">{foot}</div>}
    </div>
  )
}


