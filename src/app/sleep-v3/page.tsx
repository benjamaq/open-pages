export const metadata = {
  title: 'BioStackr: Sleep — See What’s Keeping Me Awake',
  description: 'Find your first clear sleep pattern in 7–14 days with a 20-second daily check-in.'
};

import Link from 'next/link'
import Image from 'next/image'
import { Tomorrow } from 'next/font/google'
const CTA_TEXT = "Find MY Sleep Trigger — Free (Takes 20 Seconds)";
const tomorrow = Tomorrow({ subsets: ['latin'], weight: ['500','600'] })

function PrimaryCTA({ className = "" }: { className?: string }) {
  return (
    <a
      href="/auth/signup"
      className={`inline-flex items-center justify-center rounded-lg bg-[#F4B860] px-3 py-1.5 text-[11px] sm:px-3.5 sm:py-2 sm:text-sm font-medium leading-tight text-slate-900 shadow-sm hover:bg-[#E5A850] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B860] ${className}`}
    >
      {CTA_TEXT}
    </a>
  );
}

function SecondaryCTA({ className = "" }: { className?: string }) {
  return (
    <a
      href="#how-it-works"
      className={`inline-flex items-center justify-center rounded-lg border border-white/30 px-3 py-1.5 text-[11px] sm:px-3.5 sm:py-2 sm:text-sm font-medium leading-tight text-white/90 hover:bg-white/5 ${className}`}
    >
      How It Works (20 seconds/day)
    </a>
  );
}

function Section({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}>{children}</section>
  );
}

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 ${className}`}>{children}</div>
  );
}

import Starfield from '@/components/Starfield';

function Hero() {
  return (
    <header className="relative isolate overflow-hidden bg-gradient-to-b from-[#1b2745] via-[#283a72] to-[#F6D8A6] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.10),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(244,184,96,0.22),transparent_55%),radial-gradient(circle_at_60%_75%,rgba(255,255,255,0.06),transparent_45%)]" />
      {/* warm horizon glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#F4B860]/35 via-[#F4B860]/10 to-transparent" />
      <Container>
        <div className="flex flex-col items-center text-center gap-6 pt-12 pb-12 md:py-20">
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">Still can’t sleep? We’ll show you why.</h1>
          <p className="max-w-3xl text-xl md:text-2xl leading-relaxed text-white/90">
            You’ve tried magnesium, mouth tape, no screens, early workouts — and you’re still awake at 2am. The answer isn’t another hack. It’s in your patterns — and you can see them in a week.
          </p>

          {/* CTAs */}
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <PrimaryCTA />
            <SecondaryCTA />
          </div>
          <p className="text-white/95 text-base md:text-lg mt-2"><span className="text-[#F4B860] font-semibold">Your job</span> — 20‑second check‑in daily. You spend longer choosing your socks.</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/85 text-sm">
            <span>✓ No wearable</span>
            <span>✓ No credit card</span>
            <span>✓ First pattern in 7–14 days</span>
          </div>
          {/* Hero proof: compact, specific timing example (smaller on mobile) */}
          <div className="mt-8 w-full max-w-3xl mx-auto rounded-xl border border-white/15 bg-white/10 backdrop-blur p-4 md:p-5 flex gap-3 items-start">
            <img src="/girl%20image.png" alt="Ash" className="h-10 w-10 rounded-full object-cover border border-amber-400 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-[13px] md:text-sm text-white/95 italic">
                “Taking my supplements in the afternoon instead of morning. Such a simple thing. Took me 2 years to figure out — BioStackr found it in 9 days.”
              </p>
              <p className="text-[11px] md:text-xs text-white/80 mt-1">— Ash, 32, Portland</p>
            </div>
          </div>
          <p className="mt-2 text-[12px] md:text-sm text-white/85">Over 5,000 people have found their sleep trigger with BioStackr.</p>
        </div>
      </Container>

      {/* Sticky mobile bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-[#1f2a44]/70 px-5 py-1 backdrop-blur md:hidden border-t border-white/10">
        <div className="mx-auto max-w-6xl">
          <PrimaryCTA className="w-full" />
        </div>
      </div>
    </header>
  );
}

function PatternShowcase() {
  return (
    <Section id="example" className="bg-white">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">A real pattern, discovered in 5 days</h2>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">With phone in bedroom</p>
                <div className="mt-2 h-3 w-full rounded-full bg-slate-100"><div className="h-3 rounded-full bg-[#FF7A7A]" style={{ width: '50%' }} /></div>
                <p className="mt-1 text-xs text-slate-500">Sleep 5/10</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Phone left outside</p>
                <div className="mt-2 h-3 w-full rounded-full bg-slate-100"><div className="h-3 rounded-full bg-[#34D399]" style={{ width: '70%' }} /></div>
                <p className="mt-1 text-xs text-slate-500">Sleep 7/10</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">“Phone stayed out of the bedroom”</h3>
            <p className="mt-3 text-slate-700">“I used to climb into bed and scroll. The blue light didn’t help, but the real fix was intention — when my phone stayed in another room, <span className="font-semibold">going to bed became about sleep again.</span>”</p>
            <p className="mt-3 text-sm text-slate-500">High confidence • 9 nights</p>
            <PrimaryCTA className="mt-6" />
          </div>
        </div>
      </Container>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    { title: 'Log — 20 seconds', text: 'Note sleep + what you did (coffee, stress, screens).', icon: '📝' },
    { title: 'Elli finds your trigger', text: "Example: ‘It’s not stress. It’s the 3pm latte.’", icon: '🔍' },
    { title: 'Sleep better', text: 'One change. One week. One win.', icon: '✅' },
  ];
  return (
    <Section id="how-it-works" className="bg-white">
      <Container>
        <h2 className="text-3xl font-bold text-slate-900">Three steps. One week. Clear answers.</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-2xl">{s.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">Day 1: Start • Days 3–5: first signals • Days 7–14: first clear pattern</p>
        <PrimaryCTA className="mt-6" />
      </Container>
    </Section>
  );
}

function Testimonials() {
  const items = [
    { name: 'Alex, 29 — Insomnia', quote: 'Phone out of the bedroom → asleep 90 min earlier by day 12.', img: '/male 38.png' },
    { name: 'Lars, 46 — Poor sleep', quote: 'Afternoon coffee was the problem. Moved to mornings. Week 2: fewer 3am wake-ups.', img: '/male image.png' },
    { name: 'Sylvia, 34 — Sleep issues', quote: 'Evening workouts were killing me. Switched to mornings — slept through twice in week 3.', img: '/female 34.png' },
  ];
  return (
    <Section id="proof" className="bg-slate-50/60">
      <Container>
        <h2 className="text-3xl font-bold text-slate-900">Built for people who’ve already tried everything</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {items.map((t) => (
            <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
              </div>
              <p className="mt-4 text-slate-700">“{t.quote}”</p>
            </div>
          ))}
        </div>
        <PrimaryCTA className="mt-8" />
      </Container>
    </Section>
  );
}

function PatternCard({ title, before, after, note, confidence, isReversal }: { title: string; before: string; after: string; note: string; confidence: string; isReversal?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm"><span className={`inline-flex h-2 w-2 rounded-full ${isReversal ? 'bg-[#34D399]' : 'bg-[#FF7A7A]'}`} /><span className="text-slate-700">{before}</span></div>
        <div className="flex items-center gap-2 text-sm"><span className={`inline-flex h-2 w-2 rounded-full ${isReversal ? 'bg-[#FF7A7A]' : 'bg-[#34D399]'}`} /><span className="text-slate-700">{after}</span></div>
      </div>
      <p className="mt-3 text-slate-600">{note}</p>
      <p className="mt-2 text-xs text-slate-500">{confidence}</p>
    </div>
  );
}

function MorePatterns() {
  const data = [
    { title: 'Evening arguments → later sleep', before: 'Talks after 9pm: Sleep 4/10', after: 'Talks before 7pm: Sleep 7/10', note: 'We moved tough chats earlier. Evenings got quiet — my brain finally slowed down.', confidence: 'High confidence' },
    { title: 'Meals too close to bed', before: 'Ate ≤1h before bed: Sleep 5/10', after: 'Ate ≥3h before bed: Sleep 7/10', note: 'Same food, earlier timing — no 3am wake‑ups.', confidence: 'Moderate confidence' },
    { title: 'Magnesium made sleep worse (for me)', before: 'Before magnesium: Sleep 7/10', after: 'While taking magnesium: Sleep 5/10 ↓', note: 'Everyone said magnesium helps you sleep. For me it did the opposite — I felt anxious and woke up more. I stopped and slept through the night within a week.', confidence: 'High confidence', isReversal: true },
    { title: 'Room temperature', before: 'Hot room: fragmented sleep', after: 'Cool room: improved', note: 'Lowering the thermostat by 2°C cut night wakings in half.', confidence: 'Moderate confidence' },
  ];
  return (
    <Section id="patterns" className="bg-white">
      <Container>
        <h2 className="text-3xl font-bold text-slate-900">More patterns BioStackr uncovers</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {data.map((d) => (<PatternCard key={d.title} {...d} />))}
        </div>
        <PrimaryCTA className="mt-8" />
      </Container>
    </Section>
  );
}

function Timeline() {
  const items = [
    { title: 'Day 1', text: 'Start — 20‑second check‑ins.' },
    { title: 'Days 3–5', text: 'First signals — “these nights look different”.' },
    { title: 'Days 7–14', text: 'First clear pattern — specific next step to try.' },
  ];
  return (
    <Section id="timeline" className="bg-slate-50/60">
      <Container>
        <h2 className="text-3xl font-bold text-slate-900">What the next two weeks look like</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {items.map((i) => (
            <div key={i.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-amber-600">{i.title}</p><p className="mt-2 text-slate-700">{i.text}</p></div>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">Everyone’s different. Most people see their first clear pattern in 7–14 days.</p>
      </Container>
    </Section>
  );
}

function Founder() {
  return (
    <Section id="why" className="bg-white">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="md:flex md:items-center md:justify-between md:gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-900">Why I built BioStackr</h2>
              <p className="mt-4 text-slate-700">“I watched my mum try everything for years — more data, more apps, zero answers. I built this to give people clarity, not just charts.”</p>
              <p className="mt-2 text-sm text-slate-500">— Ben, Founder</p>
            </div>
            <div className="mt-6 md:mt-0 flex justify-center md:justify-end">
              <Image src="/mum%20photo.png" alt="Ben with his mum" width={280} height={280} className="h-36 w-36 md:h-56 md:w-56 rounded-xl object-cover shadow" />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Pricing() {
  return (
    <Section id="pricing" className="bg-white">
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
            <a href="/auth/signup" className="mt-6 inline-flex rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50">Start Free</a>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Premium</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">$9.99 <span className="text-base font-medium text-slate-500">/ month</span></p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>✓ Everything in Free</li>
              <li>✓ Add more context (unlimited items & tags)</li>
            </ul>
            <a href="/auth/signup/pro" className="mt-6 inline-flex rounded-xl bg-[#F4B860] px-5 py-3 font-semibold text-slate-900 hover:bg-[#E5A850]">Unlock Full Patterns →</a>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">No credit card for Free. Cancel anytime.</p>
      </Container>
    </Section>
  );
}

function MicroFAQ() {
  const faqs = [
    { q: 'Will this actually work for me?', a: 'If a pattern exists in your recent data, we usually surface it within 7–14 days. Most new users get a first clear pattern in two weeks or less. Keep using Free until you do — we never lock your data behind a paywall.' },
    { q: 'Do I need a wearable?', a: 'No. A 20‑second daily check‑in is enough to find patterns. If you connect Apple Watch, Oura or Whoop, we can auto‑import sleep, activity and HR data to strengthen the signals — completely optional.' },
    { q: 'What if I forget to check in?', a: 'Totally fine. The model looks across weeks and timing windows (e.g., evening coffee vs morning coffee), so a few missed days won’t break anything. You control gentle reminders and can snooze or turn them off anytime.' },
    { q: 'Is my data private?', a: 'Yes. Your data is encrypted in transit and at rest. We never sell your data or train public models on it. You can export everything or permanently delete your account from Settings at any time.' },
  ];
  return (
    <Section id="faq" className="bg-white">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900">Common questions</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-left text-base font-semibold text-slate-900">{f.q}<span className="ml-3 text-slate-400 group-open:rotate-180 transition">▾</span></summary>
                <p className="mt-3 text-slate-700">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 py-20 text-white">
      <Container>
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Find your sleep trigger. Start tonight.</h2>
          <p className="mt-3 text-white/90">Log today. See your first signals this week.</p>
          <PrimaryCTA className="mt-6" />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/80 text-sm">
            <span>✓ No wearable</span>
            <span>✓ 20 sec/day</span>
            <span>✓ First pattern in 7–14 days</span>
          </div>
        </div>
      </Container>
      <div id="get-started" />
    </section>
  );
}

export default function SleepV3Page() {
  return (
    <main className="scroll-smooth">
      <Hero />
      <PatternShowcase />
      <HowItWorks />
      <MicroFAQ />
      <Testimonials />
      <MorePatterns />
      <Timeline />
      <Founder />
      <Pricing />
      <FinalCTA />
    </main>
  );
}


