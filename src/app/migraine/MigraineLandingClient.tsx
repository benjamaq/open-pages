"use client";
import Link from "next/link";
import Starfield from "@/components/Starfield";
import PwaTopBanner from "@/components/PwaTopBanner";
import PwaInstallSection from "@/components/landing/PwaInstallSection";
import { useEffect, useRef, useState } from "react";

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-6 lg:px-8 ${className}`}>{children}</div>;
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`py-20 lg:py-28 ${className}`}>{children}</section>;
}

export default function MigraineLandingClient() {
  const imgRef = useRef<HTMLDivElement | null>(null);
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      // Gentle parallax: move image at 5% of scroll
      const next = Math.min(30, Math.max(-30, y * 0.05));
      setParallax(next);
    };
    const onScrollRaf = () => {
      raf = requestAnimationFrame(onScroll);
    };
    window.addEventListener('scroll', onScrollRaf, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScrollRaf as any);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <main>
      <PwaTopBanner />

      {/* HERO */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Base gradient (softer for migraine) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#312E81] via-[#4C1D95] to-[#E8B86D] opacity-80" />
        {/* Background hero image (subject on right third) */}
        <div
          ref={imgRef}
          aria-hidden
          className="absolute inset-0 will-change-transform"
          style={{
            backgroundImage: "url('/female%20image.png')",
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
            opacity: 0.85,
            mixBlendMode: 'soft-light',
            filter: 'brightness(0.9)',
            transform: `translateY(${parallax}px)`,
          }}
        />
        {/* Readability gradient left → right (multi-stop, cooler violet bias, slightly stronger on left) */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(32,22,50,0.8) 0%, rgba(45,30,65,0.5) 40%, rgba(70,40,70,0.2) 80%, rgba(60,40,70,0.0) 100%)',
          }}
        />
        {/* Subtle bottom amber tint to integrate image with brand hue (lighter) */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#E8B86D]/18 via-transparent to-transparent" />
        {/* Left feathered blur for extra legibility */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{ width: '56px', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', background: 'linear-gradient(to right, rgba(20,16,36,0.25), rgba(20,16,36,0))' }}
        />
        {/* Subtle vignette to draw focus inward */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(20,16,36,0.08) 100%)',
          }}
        />
        <Starfield count={80} opacity={0.35} />

        {/* Top Nav removed in favor of universal header */}

        {/* Content */}
        <Container className="relative z-10 px-6 pt-28 sm:pt-32 pb-16 sm:pb-24">
          <div className="max-w-4xl">
            <p className="tracking-wide text-white/90 font-light text-[24px] sm:text-[28px] mb-6">Pattern Discovery for Your Health</p>
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Finally Understand What Triggers Your Migraines
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 max-w-3xl">
              Track for 20 seconds a day. BioStackr's intelligent system analyzes everything you log to uncover the
              patterns most associated with your migraines—so you can avoid them before they hit.
            </p>
            <div className="flex gap-4 flex-wrap mb-4">
              <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-lg bg-[#E8B86D] px-8 py-4 text-base font-semibold text-black transition-all hover:bg-[#d9a860]">Stop Guessing. Find My Triggers Now</Link>
              <Link href="#how-it-works" className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10">See How It Works</Link>
            </div>
            <p className="mt-2 text-base md:text-lg text-white/85">Install in one tap · Daily reminders</p>
          </div>
        </Container>
      </section>

      {/* PROBLEM */}
      <Section className="bg-white">
        <Container className="relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">You've tried everything. The problem is the pattern is invisible.</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Neurologists say "avoid your triggers"—but which ones, and in what combination?
            </p>
            <p className="text-gray-700 leading-relaxed">
              Red wine + poor sleep? Bright light after a stressful day? Weather shifts 24–48h before? Hormone changes?
              <br />
              You can't avoid everything. You need to know what affects you, and when.
              <br />
              Most apps show graphs. BioStackr shows what to do.
            </p>
          </div>
        </Container>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how-it-works" className="bg-[#F5F5F5]">
        <Container className="relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4 text-center">How it works</h2>
          <p className="text-xl text-gray-600 mb-16 text-center">A clear path from rough days to reliable answers.</p>
          <div className="grid gap-8 md:grid-cols-3">
            {[{icon:'⏱️',title:'Quick Daily Check-in (Even With Pain)',desc:"Rate your pain, sleep, and stress. Tag anything you ate, drank, or did that day. No journaling. No endless forms. Designed to be usable when you're hurting."},
              {icon:'🧠',title:'AI Connects the Dots',desc:'After 5–7 days, you\'ll see early signals. We test single and combination triggers, and detect 24–48h lags (e.g., weather or cycle shifts)—so you\'re not chasing same-day red herrings.'},
              {icon:'💡',title:'You Get Clear, Actionable Answers',desc:'"When you drink red wine and sleep <6h, your migraine severity is +38% the next day." Not a correlation chart. Actual insights you can act on.'}].map((s)=> (
              <div key={s.title} className="text-center bg-white border border-gray-200 rounded-2xl p-8">
                <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#E8B86D]"><span className="text-3xl font-bold text-black">{s.icon}</span></div>
                <h3 className="mb-4 text-xl font-semibold text-black">{s.title}</h3>
                <p className="text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* PROOF CARDS */}
      {/* PROOF CARDS with full-background abstract image */}
      <Section className="relative overflow-hidden">
        {/* Background image */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/abstract%20image.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.75) saturate(1)'
          }}
        />
        {/* Dark violet overlay for readability (lightened) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/55 via-[#2A2A45]/45 to-[#1A1A2E]/55" />
        <Container className="relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">Here's What BioStackr Actually Tells You</h2>
            <p className="text-gray-200">Not graphs. Clear patterns you can act on.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#E8B86D] transition">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 mb-3">Detected combo (high confidence)</span>
              <div className="text-lg font-bold text-black mb-3">Red wine + &lt;6h sleep → +38% severity next day</div>
              <div className="text-sm text-amber-700">Action: Skip wine or aim for 7–8h on social nights.</div>
            </div>
            {/* Card 2 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#E8B86D] transition">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-3">Lagged trigger (moderate confidence)</span>
              <div className="text-lg font-bold text-black mb-3">Pressure drop ≥5 hPa → onset in 24–48h</div>
              <div className="text-sm text-amber-700">Action: Hydration + earlier wind-down on "storm" days.</div>
            </div>
            {/* Card 3 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#E8B86D] transition">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-3">Cycle window (moderate confidence)</span>
              <div className="text-lg font-bold text-black mb-3">Perimenstrual days −2 to +2 → 2× risk</div>
              <div className="text-sm text-amber-700">Action: Pre-emptive magnesium + earlier bedtime.</div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FEATURES (plain) */}
      <Section className="bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">Why BioStackr works for migraines</h2>
            <p className="text-xl text-gray-600">Built for real life, not perfect tracking days</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon:'🎯', title:'Find YOUR triggers, not generic advice', text:'Your data, your patterns. No one-size-fits-all lists.' },
              { icon:'⏰', title:'Track in 20 seconds, even with a migraine', text:'No long forms. No typing. Just sliders and taps. Designed to be usable when you\'re in pain. Includes low‑glare "migraine mode" with softer contrast.' },
              { icon:'🔒', title:'Your data stays private', text:'Private by default. Export or delete anytime.' },
              { icon:'🔗', title:'Combo & lag detection', text:'Find triggers that only show up together (e.g., chocolate + late screen time) and patterns that hit 24–48h later (e.g., weather or cycle changes).' },
              { icon:'📅', title:'Cycle‑aware insights', text:'Optionally track cycle phases; we\'ll flag predictable windows and protective habits. Know your high‑risk days in advance.' },
              { icon:'🌦️', title:'Weather & pressure aware', text:'Account for barometric pressure and weather swings so you\'re not chasing same‑day red herrings.' },
            ].map((f)=> (
              <div key={f.title} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-6">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-semibold text-black mb-2 text-lg">{f.title}</h3>
                <p className="text-gray-700 leading-relaxed text-sm">{f.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* TESTIMONIALS with full-background abstract image3 */}
      <Section className="relative overflow-hidden">
        {/* Background image */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/abstract%20image3.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.8) saturate(1)'
          }}
        />
        {/* Readability overlay (lightened) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/45 via-[#2A2A45]/35 to-[#1A1A2E]/45" />
        <Container className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">In their words</h2>
            <p className="text-gray-200">Real people, specific breakthroughs</p>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
            {[
              { q:'"Red wine + <6h sleep was my combo. Cutting it reduced attacks ~70% in 3 weeks. I finally got my evenings back."', n:'Ana M., 34 · Porto' },
              { q:'"I needed analysis, not a diary. BioStackr surfaced pressure drops 48h before my attacks—now I prep on storm days."', n:'Ravi S., 41 · Bangalore' },
              { q:'"Aura showed up on nights with screens + stress. The reminders help me power down earlier. No triptan for 6 weeks."', n:'Elena K., 29 · Athens' },
              { q:'"Perimenstrual days were my risky window. Magnesium + earlier bedtime those nights cut severity in half."', n:'Lucía R., 38 · Madrid' },
              { q:'"Travel used to wreck me. The app flagged dehydration + late dinners. Two small changes, huge difference."', n:'Noah F., 32 · Toronto' },
              { q:'"I thought caffeine was bad—turns out withdrawal days were worse. Timing solved it. Clear and practical."', n:'Mina T., 27 · Seoul' },
            ].map((t,i)=> (
              <div key={i} className="min-w-[340px] md:min-w-[380px] snap-center">
                <div className="rounded-3xl bg-white/90 backdrop-blur-sm border border-gray-200 p-8 shadow-sm h-full flex flex-col">
                  <blockquote className="text-lg leading-relaxed text-gray-900 mb-6 flex-grow">{t.q}</blockquote>
                  <div className="text-sm text-gray-600">— {t.n}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="md:hidden text-center text-gray-200 text-xs mt-1">← Swipe →</div>
        </Container>
      </Section>

      {/* PRICING */}
      <Section className="bg-white" id="pricing">
        <Container>
          <div className="text-center mb-4 text-gray-700">Start free. Upgrade only if we surface clear patterns.</div>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-2">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="rounded-3xl border-2 border-gray-200 bg-white p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Free</h3>
                <div className="flex items-baseline gap-2 mb-4"><span className="text-5xl font-bold text-black">$0</span><span className="text-gray-500">/month</span></div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Track up to 12 items','Daily check-ins (20 seconds)','Pattern detection','Basic insights'].map((li) => (
                  <li key={li} className="flex items-start gap-3"><svg className="h-6 w-6 text-[#E8B86D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg><span className="text-gray-700">{li}</span></li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center rounded-lg border-2 border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50">Start Free</Link>
            </div>
            <div className="rounded-3xl border-2 border-[#E8B86D] bg-gradient-to-br from-[#FFF9F0] to-white p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2"><span className="bg-[#E8B86D] text-black px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span></div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Premium</h3>
                <div className="flex items-baseline gap-2 mb-4"><span className="text-5xl font-bold text-black">$9.99</span><span className="text-gray-500">/month</span></div>
                <p className="text-gray-600">For deep, migraine‑specific insights</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Free','Unlimited items to track','Priority support','Export your data'].map((li) => (
                  <li key={li} className="flex items-start gap-3"><svg className="h-6 w-6 text-[#E8B86D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg><span className="text-gray-900 font-medium">{li}</span></li>
                ))}
              </ul>
              <Link href="/auth/signup/pro" className="block w-full text-center rounded-lg bg-[#E8B86D] px-6 py-3 text-base font-semibold text-black transition-all hover:bg-[#d9a860]">Start Premium</Link>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">Cancel anytime · No credit card required for free plan</p>
        </Container>
      </Section>

      {/* FINAL CTA with full-background abstract image2 (spaced away from Proof Cards) */}
      <Section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/abstract%20image2.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.7) saturate(1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/55 via-[#2A2A45]/45 to-[#1A1A2E]/55" />
        <Container className="relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-4xl lg:text-5xl font-bold text-white">Stop living around your migraines</h2>
            <p className="mb-2 text-xl text-gray-200">Start today—most people see usable patterns in 5–7 days.</p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#E8B86D] px-8 py-4 text-base font-semibold text-black transition-all hover:bg-[#d9a860]"
            >
              Start Free — 20 Seconds a Day
            </Link>
            <p className="mt-6 text-sm text-gray-200">Install in one tap · Daily reminders · Private by default</p>
          </div>
        </Container>
      </Section>

      {/* PWA Install Section */}
      <PwaInstallSection />

      {/* FOOTER */}
      <footer className="bg-[#F5F5F5] py-12">
        <Container>
          <div className="text-center">
            <div className="flex justify-center gap-6">
              <Link href="/contact" className="text-gray-600 hover:text-black transition">Contact</Link>
              <Link href="/privacy" className="text-gray-600 hover:text-black transition">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-black transition">Terms</Link>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}


