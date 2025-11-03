"use client";
import Link from "next/link";
import Image from "next/image";
import ScrollControls from "@/components/ScrollControls";
import Starfield from "@/components/Starfield";
import PwaTopBanner from "@/components/PwaTopBanner";
import PwaInstallSection from "@/components/landing/PwaInstallSection";
import type React from "react";
import { trackEvent } from "@/lib/analytics";

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-6 lg:px-8 ${className}`}>{children}</div>;
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`py-20 lg:py-28 ${className}`}>{children}</section>;
}

export default function SleepLandingV2() {
  const onCta = (name: string, params?: Record<string, any>) => {
    try { trackEvent(name, { page: "/sleep", ...(params || {}) }); } catch {}
  };
  return (
    <main>
      <PwaTopBanner />
      {/* SECTION 1: HERO (EVENING GRADIENT WITH STARS) */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A4F5C] via-[#2A6B7A] to-[#D4A574]" />
        {/* Stars */}
        <Starfield count={150} opacity={0.7} />
        {/* Moon */}
        <div
          aria-hidden
          className="hidden sm:block absolute right-[10%] top-[12%] w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/90 ring-1 ring-white/60 shadow-[0_0_60px_20px_rgba(255,255,255,0.25)]"
        />
        {/* Top Nav */}
        <div className="absolute top-4 left-0 right-0 z-20">
          <Container className="px-6">
            <div className="flex items-center justify-between gap-6 text-white/90 text-sm">
              <Link href="/">
                <img src="/BIOSTACKR LOGO 2.png" alt="BioStackr" className="h-10 lg:h-12 w-auto" />
              </Link>
              <div className="flex items-center gap-6">
                <Link href="#pricing" className="hover:underline" onClick={() => onCta('view_content', { content_name: 'pricing_nav' })}>Pricing</Link>
                <Link href="/contact" className="hover:underline" onClick={() => onCta('view_content', { content_name: 'contact_nav' })}>Contact</Link>
                <Link href="/auth/signin" className="hover:underline" onClick={() => onCta('cta_click', { cta: 'sign_in_nav' })}>Sign In</Link>
                <Link href="/auth/signup" className="hover:underline" onClick={() => onCta('lead', { cta: 'sign_up_nav' })}>Sign Up</Link>
              </div>
            </div>
          </Container>
        </div>
        {/* Content */}
        <Container className="relative z-10 px-6 pt-28 sm:pt-32">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-wider text-white/70 mb-4">INTELLIGENT SLEEP DIAGNOSTICS</p>
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Can't sleep?
              <br />
              We'll find what's keeping you awake.
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 max-w-3xl">
              BioStackr's intelligent system analyzes everything you do against your sleep—700+ data points per day to find what's keeping you awake.
            </p>
            <div className="flex gap-4 flex-wrap mb-4">
              <Link href="/auth/signup" onClick={() => { onCta('cta_click', { cta: 'find_sleep_trigger' }); onCta('lead', { cta: 'find_sleep_trigger' }); }} className="inline-flex items-center justify-center rounded-lg bg-[#E8B86D] px-8 py-4 text-base font-semibold text-black transition-all hover:bg-[#d9a860]">Fix Your Sleep Free</Link>
              <Link href="#how-it-works" onClick={() => onCta('cta_click', { cta: 'see_how_it_works' })} className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10">See How It Works</Link>
            </div>
            
          </div>
        </Container>
      </section>

      

      

      {/* SECTION 2: HOW IT WORKS (simplified title) */}
      <Section id="how-it-works" className="bg-[#F5F5F5]">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4 text-center">How it works</h2>
          <p className="text-xl text-gray-600 mb-16 text-center">Not just tracking—multi-variable pattern detection across 700+ daily data points.</p>
          <div className="grid gap-8 md:grid-cols-3">
            {[{n:1,title:'20 seconds',desc:'Rate sleep (1–10) and note anything relevant. We expand it into 700+ analyzable features (timing, dose, sequence, co-occurrence, trends).'},
              {n:2,title:'Pattern engine',desc:'Analyzes weeks of data across variables. Tests timing windows, dose-response, and combinations (e.g., caffeine after 2pm + late exercise).'},
              {n:3,title:'Clear answers',desc:"When you have caffeine after 2pm, you take 3× longer to fall asleep.' No graphs to decipher—just what helps or hurts."}].map(s=> (
              <div key={s.n} className="text-center bg-white border border-gray-200 rounded-2xl p-8">
                <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#E8B86D]"><span className="text-3xl font-bold text-black">{s.n}</span></div>
                <h3 className="mb-4 text-xl font-semibold text-black">{s.title}</h3>
                <p className="text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* New PWA Install Section */}
      <PwaInstallSection />

      {/* SECTION 3: PATTERN EXAMPLES WITH DATA (carousel) */}
      <Section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A4F5C] via-[#2A6B7A] to-[#D4A574]" />
        <Starfield count={120} opacity={0.4} />
        <Container className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">Real patterns BioStackr found</h2>
              <p className="text-xl text-white/80">Actual discoveries from real users in their first 2 weeks</p>
            </div>
            <ScrollControls targetId="patterns-track" />
          </div>
          <div id="patterns-track" className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
            {[
              { emoji:'☕', title:'Caffeine cutoff timing', person:'Marcus · Chronic pain · Austin', redLabel:'3 hours to fall asleep', greenLabel:'45 minutes to fall asleep', quote:'"Afternoon coffee was the culprit. Moving it earlier changed everything."' },
              { emoji:'🌙', title:'Magnesium Glycinate', person:'Emma · Fibromyalgia · Seattle', redLabel:'Sleep quality 4/10', greenLabel:'Sleep quality 8/10', quote:'"Three nights in a row was the key. Consistency mattered."' },
              { emoji:'🏃', title:'Evening Exercise', person:'Jordan · ADHD · Portland', redLabel:'2 hr sleep delay', greenLabel:'Onset in 30–45 min', quote:'"Morning workouts solved my sleep onset problems."' },
              { emoji:'🍷', title:'Alcohol timing', person:'—', redLabel:'Fragmented sleep', greenLabel:'Stable sleep', quote:'"Late drinks wrecked my deep sleep. Earlier or fewer made it predictable."' },
              { emoji:'🌡️', title:'Room temperature', person:'—', redLabel:'Hot room: poor sleep', greenLabel:'Cool room: improved', quote:'"Lowering the thermostat by 2°C cut night wakings in half."' },
              { emoji:'📱', title:'Screen time before bed', person:'—', redLabel:'After 10pm: 45min delay', greenLabel:'Phones down by 9:30pm', quote:'"Blue light near bedtime delayed sleep reliably."' },
              { emoji:'🍽️', title:'Late meals', person:'—', redLabel:'Eating after 9pm', greenLabel:'Last meal 6–7pm', quote:'"Earlier dinners reduced reflux and improved sleep onset."' },
              { emoji:'😰', title:'Stress after 6pm', person:'—', redLabel:'High stress → wired', greenLabel:'Decompressing earlier', quote:'"Evening stress showed up as late sleep onset every time."' },
            ].map((p, idx) => (
              <div key={idx} className="min-w-[500px] snap-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-white/20 p-8 shadow-2xl h-full w-[500px]">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="text-4xl">{p.emoji}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-black mb-2">{p.title}</h3>
                      <p className="text-sm text-gray-500">{p.person}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-4">Outcome comparison</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1"><span>Worse condition</span><span className="font-semibold text-red-600">{p.redLabel}</span></div>
                        <div className="h-8 bg-red-200 rounded" style={{ width: '90%' }} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1"><span>Better condition</span><span className="font-semibold text-green-600">{p.greenLabel}</span></div>
                        <div className="h-8 bg-green-200 rounded" style={{ width: '25%' }} />
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-800 leading-relaxed border-l-4 border-[#E8B86D] pl-4">{p.quote}</blockquote>
                </div>
              </div>
            ))}
          </div>
          {/* Mobile swipe hint */}
          <div className="md:hidden text-center text-white/80 text-xs mt-1">
            ← Swipe →
          </div>
        </Container>
      </Section>

      {/* SECTION 4.5: PRICING moved below patterns */}
      <Section className="bg-white" id="pricing">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">Simple, transparent pricing</h2>
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
                <p className="text-gray-600">For serious sleep optimization</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Free','Unlimited items to track','Priority support','Export your data'].map((li) => (
                  <li key={li} className="flex items-start gap-3"><svg className="h-6 w-6 text-[#E8B86D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg><span className="text-gray-900 font-medium">{li}</span></li>
                ))}
              </ul>
              <Link href="/auth/signup/pro" onClick={() => { onCta('cta_click', { cta: 'start_premium' }); onCta('begin_checkout', { plan: 'pro' }); }} className="block w-full text-center rounded-lg bg-[#E8B86D] px-6 py-3 text-base font-semibold text-black transition-all hover:bg-[#d9a860]">Start Premium</Link>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">Cancel anytime · No credit card required for free plan</p>
        </Container>
      </Section>
      <Section className="bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">Let BioStackr find what's keeping you awake</h2>
            <p className="text-xl text-gray-600">It could be anything. You track what matters—we find the pattern.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            {[
              { title: 'Diet & Timing', items: ['Caffeine timing','Late meals','Dairy products','Alcohol consumption','Spicy foods','Sugar intake','Meal timing'] },
              { title: 'Lifestyle & Activity', items: ['Exercise timing','Stress levels','Screen time','Napping patterns','Work schedule','Social activities','Travel/jet lag'] },
              { title: 'Environment & Health', items: ['Room temperature','Light exposure','Noise levels','Pain levels','Medications','Supplements','Anything else'] },
            ].map((col) => (
              <div key={col.title} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-6">
                <h3 className="font-semibold text-black mb-4 text-lg">{col.title}</h3>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-[#E8B86D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFF9F0] to-white border-2 border-[#E8B86D] rounded-full px-6 py-3 mb-4">
              <span className="text-xl">+</span>
              <span className="font-semibold text-black">anything else you track</span>
            </div>
            <p className="text-gray-600 text-lg">You tell us what matters. We connect the dots.</p>
          </div>
        </Container>
      </Section>

      

      {/* SECTION 5: REAL BREAKTHROUGHS */}
      <Section className="bg-white">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-bold text-black mb-12 text-center">Real breakthroughs in 7-14 days</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { initial:'E', name:'Emma', meta:'Fibromyalgia · Seattle', stat:'Sleep improved 4/10 → 8/10', story:[
                'For years, Emma tried every recommended sleep hack. She tracked REM, bought an expensive wearable, and still woke up exhausted.',
                'With BioStackr, she logged a simple 20-second check-in per day. The system analyzed timing, dose, and interactions across her supplements and habits—over 700 signals per day.',
                'The pattern emerged in 10 days: consistency with magnesium glycinate (400 mg) for 3+ nights correlated with better sleep quality. When she skipped, sleep dropped within 48 hours.'
              ]},
              { initial:'M', name:'Marcus', meta:'Chronic pain · Austin', stat:'Caffeine cutoff found in 4 days', story:[
                'Marcus thought his insomnia was random. He worked late, trained hard, and relied on an afternoon coffee to push through.',
                'BioStackr showed a strong association between caffeine after 2pm and a 3× longer time to fall asleep. The signal held even controlling for stress and exercise timing.',
                'By moving coffee earlier and cutting it after lunch, he started falling asleep in under an hour.'
              ]},
              { initial:'J', name:'Jordan', meta:'ADHD · Portland', stat:'Pattern found in 7 days', story:[
                'Jordan trained most evenings. Sleep was inconsistent and often delayed by hours.',
                'The system detected that workouts within 3 hours of bedtime were consistently followed by late-onset sleep.',
                'Shifting workouts to mornings stabilized sleep onset to within 30–45 minutes.'
              ]},
            ].map((t) => (
              <div key={t.name} className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#E8B86D] to-[#d9a860] text-white font-bold flex items-center justify-center">{t.initial}</div>
                  <div>
                    <div className="font-semibold text-black">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.meta}</div>
                  </div>
                </div>
                <div className="space-y-3 text-gray-800 leading-relaxed">
                  {t.story.map((p, i) => (<p key={i}>{p}</p>))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 text-sm font-semibold text-[#E8B86D]">{t.stat}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* SECTION 6: TRUSTED BY (simple scroller) */}
      <Section className="bg-white overflow-hidden">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4 text-center">Trusted by people who've tried everything</h2>
          <p className="text-center text-gray-600 mb-8">Real stories, real results</p>
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
            {[
              { q:'After 3 years of guessing, I found the answer in 2 weeks.', n:'Emma', m:'Fibromyalgia · Seattle, USA' },
              { q:"I’d never have connected the dots. The timing was everything.", n:'Marcus', m:'Chronic pain · Austin, USA' },
              { q:'Exercise timing was the issue. Now I sleep through the night.', n:'Jordan', m:'ADHD · Portland, USA' },
              { q:'Room temperature was the quiet culprit. Lowering 2°C changed everything.', n:'Clara', m:'Insomnia · London, UK' },
              { q:'Earlier dinner stopped the 2am wakeups.', n:'Akira', m:'GERD · Tokyo, Japan' },
              { q:'Phones down by 9:30pm and I fall asleep within 30 minutes.', n:'Maya', m:'Anxiety · Toronto, Canada' },
              { q:'Afternoon espresso pushed sleep past midnight—cutting it fixed it.', n:'Luca', m:'Entrepreneur · Milan, Italy' },
              { q:'Moving workouts to mornings stabilized my schedule.', n:'Priya', m:'ADHD · Bengaluru, India' },
              { q:'Blue light was wrecking me. Amber glasses and earlier cutoff worked.', n:'Sven', m:'Developer · Berlin, Germany' },
              { q:'No wearables—just 20 seconds a day, and I finally saw the pattern.', n:'Elena', m:'Designer · Sydney, Australia' }
            ].map((t,i)=> (
              <div key={i} className="min-w-[340px] md:min-w-[380px] snap-center">
                <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-8 shadow-sm h-full flex flex-col">
                  <blockquote className="text-lg leading-relaxed text-gray-900 mb-6 flex-grow">“{t.q}”</blockquote>
                  <div className="text-sm text-gray-500"><span className="font-semibold text-black">{t.n}</span> — {t.m}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* SECTION 9: TIMELINE EXPECTATIONS */}
      <Section className="bg-[#F5F5F5]">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4 text-center">How long until you find your trigger?</h2>
          <p className="text-xl text-gray-600 mb-12 text-center">Most people see their first breakthrough in 7-14 days</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title:'Days 1–3: Getting started', body:'Record baseline sleep, mood, pain. Add what you’re trying (supplements, caffeine, workouts, meals, stress).'},
              { title:'Days 4–7: First patterns emerge', body:'The system begins to test timing windows and interactions. Expect early hypotheses and small adjustments.'},
              { title:'Days 7–14: Breakthrough moment', body:'A clear pattern usually emerges (e.g., caffeine cutoff, exercise timing, room temperature). This card is highlighted.'},
            ].map((c, i) => (
              <div key={c.title} className={`rounded-2xl border p-6 ${i===2? 'border-[#E8B86D] bg-[#FFF9F0]':'border-gray-200 bg-white'}`}>
                <h3 className="text-lg font-semibold text-black mb-2">{c.title}</h3>
                <p className="text-gray-700 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* SECTION 8: FINAL CTA (WHITE) */}
      <Section className="bg-white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-4xl lg:text-5xl font-bold text-black">Stop guessing. Start knowing.</h2>
            <p className="mb-2 text-xl text-gray-600">Find what's keeping you awake in 7-14 days.</p>
            <p className="mb-8 text-gray-600">700+ data points. Intelligent analysis. Clear answers.</p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#E8B86D] px-8 py-4 text-base font-semibold text-black transition-all hover:bg-[#d9a860]"
            >
              Find Your Sleep Trigger — Free
            </Link>
            <p className="mt-6 text-sm text-gray-500">No credit card · 20 seconds per day · Free to start</p>
          </div>
        </Container>
      </Section>

      {/* SECTION 7: FACTS */}
      <Section className="bg-white">
        <Container>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { h:'700+ data points', p:'Analyzed per day from your check-ins' },
              { h:'20 seconds', p:'Typical daily tracking time' },
              { h:'Private by default', p:'Your data stays yours' },
              { h:'No wearable needed', p:'Works great without devices' },
            ].map((f) => (
              <div key={f.h} className="rounded-xl border border-gray-200 p-6 bg-gray-50">
                <div className="text-xl font-bold text-black mb-1">{f.h}</div>
                <div className="text-gray-600 text-sm">{f.p}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* SECTION 6: FOOTER (LIGHT GRAY) */}
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


