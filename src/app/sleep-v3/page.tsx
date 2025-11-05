export const metadata = {
  title: 'BioStackr: Sleep — See What’s Keeping Me Awake',
  description: 'Find your first clear sleep pattern in 7–14 days with a 20-second daily check-in.'
};

import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import Image from 'next/image'
import { Tomorrow } from 'next/font/google'
const CTA_TEXT = "Find MY Sleep Trigger — Free (Takes 20 Seconds)";
const tomorrow = Tomorrow({ subsets: ['latin'], weight: ['700'] })

function PrimaryCTA({ className = "" }: { className?: string }) {
  return (
    <a
      href="#get-started"
      className={`inline-flex items-center justify-center rounded-xl bg-[#F4B860] px-4 py-2.5 text-sm md:text-base font-semibold text-slate-900 shadow-sm hover:bg-[#E5A850] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B860] ${className}`}
    >
      {CTA_TEXT}
    </a>
  );
}

function SecondaryCTA({ className = "" }: { className?: string }) {
  return (
    <a
      href="#how-it-works"
      className={`inline-flex items-center justify-center rounded-xl border border-white/30 px-4 py-2.5 text-sm md:text-base font-semibold text-white/90 hover:bg-white/5 ${className}`}
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
    <header className="relative isolate overflow-hidden bg-gradient-to-b from-slate-800 via-slate-800 to-slate-700 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.06),transparent_45%),radial-gradient(circle_at_60%_70%,rgba(255,255,255,0.05),transparent_40%)]" />
      {/* Night sky stars */}
      <Starfield count={150} opacity={0.55} />
      <Container>
        {/* Top inside-hero row: logo + nav + CTA */}
        <div className="flex items-center justify-between pt-5">
          <div className={`${tomorrow.className} text-3xl md:text-4xl font-extrabold tracking-[0.08em]`}>
            <span>BIOSTACK</span>
            <span className="inline-block align-baseline text-[1.15em] [transform:scaleX(-1)]">R</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-white/90 hover:text-white text-sm md:text-base">Contact</Link>
            <AuthButton />
            <PrimaryCTA className="hidden sm:inline-flex" />
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-6 py-12 md:py-20">
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight md:text-6xl">Still can’t sleep? We’ll show you why.</h1>
          <p className="max-w-3xl text-lg text-white/85">
            You’ve tried magnesium, mouth tape, no screens, early workouts — and you’re still awake at 2am. The answer isn’t another hack. It’s in your patterns — and you can see them in a week.
          </p>

          {/* Proof strip */}
          <div className="mt-2 w-full max-w-3xl rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-white/90">4,287 people found their trigger in ~9 days.</p>
              <p className="text-xs text-white/70">You’re next.</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <PrimaryCTA />
            <SecondaryCTA />
          </div>

          <p className="text-white/85 text-sm">Your job: a 20-second check-in. (You spend longer choosing socks.)</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/80 text-sm">
            <span>✓ No wearable</span>
            <span>✓ No credit card</span>
            <span>✓ First pattern in 7–14 days</span>
          </div>
        </div>
      </Container>

      {/* Sticky mobile bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-slate-900/80 px-5 py-3 backdrop-blur md:hidden">
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
                <div className="mt-2 h-3 w-full rounded-full bg-slate-100"><div className="h-3 rounded-full bg-red-300" style={{ width: '50%' }} /></div>
                <p className="mt-1 text-xs text-slate-500">Sleep 5/10</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Phone left outside</p>
                <div className="mt-2 h-3 w-full rounded-full bg-slate-100"><div className="h-3 rounded-full bg-emerald-300" style={{ width: '70%' }} /></div>
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
    { name: 'Lars, 38 — Poor sleep', quote: 'Afternoon coffee was the problem. Moved to mornings. Week 2: fewer 3am wake-ups.', img: '/male image.png' },
    { name: 'Maya, 34 — Sleep issues', quote: 'Evening workouts were killing me. Switched to mornings — slept through twice in week 3.', img: '/female 34.png' },
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

function PatternCard({ title, before, after, note, confidence }: { title: string; before: string; after: string; note: string; confidence: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm"><span className="inline-flex h-2 w-2 rounded-full bg-red-300" /><span className="text-slate-700">{before}</span></div>
        <div className="flex items-center gap-2 text-sm"><span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" /><span className="text-slate-700">{after}</span></div>
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
    { title: 'Magnesium (the plot twist)', before: 'Before magnesium: Anxiety 4/10', after: 'While taking it: Anxiety 7/10 ↑', note: 'Everyone said it helps. For me it revved me up — even in the afternoon. I stopped and the anxiety vanished within a week.', confidence: 'High confidence' },
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
              <Image src="/mum%20photo.png" alt="Ben with his mum" width={120} height={120} className="h-24 w-24 md:h-28 md:w-28 rounded-lg object-cover shadow-sm" />
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
            <a href="#get-started" className="mt-6 inline-flex rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50">Start Free</a>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Premium</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">$9.99 <span className="text-base font-medium text-slate-500">/ month</span></p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>✓ Everything in Free</li>
              <li>✓ FULL pattern engine</li>
              <li>✓ Export your data</li>
              <li>✓ Priority support</li>
            </ul>
            <a href="#get-started" className="mt-6 inline-flex rounded-xl bg-[#F4B860] px-5 py-3 font-semibold text-slate-900 hover:bg-[#E5A850]">Unlock Full Patterns →</a>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">No credit card for Free. Cancel anytime.</p>
      </Container>
    </Section>
  );
}

function MicroFAQ() {
  const faqs = [
    { q: 'Will this actually work for me?', a: 'Most people see their first clear pattern in 7–14 days. Your timeline may vary — we’ll keep testing gently until it’s clear.' },
    { q: 'Do I need a wearable?', a: 'No. A 20‑second daily check‑in is enough. If you have a wearable, you can add it.' },
    { q: 'What if I forget to check in?', a: 'Missing a day or two is normal. We look across weeks, not perfection.' },
    { q: 'Is my data private?', a: 'Yes. Your data stays yours. You can export or delete anytime.' },
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


