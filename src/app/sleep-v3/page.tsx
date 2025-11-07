export const metadata = {
  title: 'BioStackr: Sleep — See What’s Keeping Me Awake',
  description: 'Find your first clear sleep pattern in 7–14 days with a 20-second daily check-in.'
};

import Link from 'next/link'
import Image from 'next/image'
import { Tomorrow } from 'next/font/google'
const CTA_TEXT = "Start Free";
const tomorrow = Tomorrow({ subsets: ['latin'], weight: ['500','600'] })

function PrimaryCTA({ className = "" }: { className?: string }) {
  return (
    <a
      href="/auth/signup"
      className={`inline-flex items-center justify-center rounded-md bg-[#f59e0b] px-8 py-4 text-lg font-bold leading-tight text-black shadow-sm hover:bg-[#d97706] hover:-translate-y-0.5 transition transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f59e0b] ${className}`}
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
import WhyDifferent from '@/components/sections/WhyDifferent';
import { AlexStoryCard } from '@/components/AlexStoryCard';
import { StepsTimeline } from '@/components/StepsTimeline';

function Hero() {
  return (
    <header className="relative isolate overflow-hidden bg-gradient-to-b from-[#0b1424] via-[#112743] to-[#0f3b46] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(148,197,249,0.12),transparent_45%),radial-gradient(circle_at_78%_22%,rgba(34,197,194,0.18),transparent_55%),radial-gradient(circle_at_60%_72%,rgba(148,197,249,0.08),transparent_45%)]" />
      {/* soft teal horizon glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#14b8a6]/25 via-transparent to-transparent" />
      {/* subtle starfields with blue/teal tint */}
      <Starfield count={140} opacity={0.5} color="#a5f3fc" />
      <Starfield count={90} opacity={0.35} color="#99f6e4" />
      {/* moon */}
      <div aria-hidden className="hidden sm:block absolute right-[10%] top-[12%] w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/90 ring-1 ring-white/60 shadow-[0_0_60px_20px_rgba(255,255,255,0.25)]" />
      <Container>
        <div className="pt-16 sm:pt-24 md:pt-40 pb-10 md:pb-24 grid md:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Headline spanning full width */}
          <div className="md:col-span-12 text-center">
            <h1 className="max-w-5xl mx-auto text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">Can’t sleep? We’ll show you why.</h1>
          </div>
          {/* Left column: subheader + CTAs */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <p className="max-w-xl text-lg md:text-xl leading-relaxed text-white/90">
              You’ve tried magnesium, mouth tape, no screens, early workouts — and you’re still awake at 2am. The answer isn’t another hack. It’s in your patterns — and you can see them in a week.
            </p>
            <div className="mt-2 flex flex-row flex-wrap items-center md:items-start gap-2">
              <PrimaryCTA className="px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm whitespace-nowrap" />
              <SecondaryCTA className="px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm whitespace-nowrap" />
            </div>
          </div>
          {/* Right column: pattern analysis diagram (slightly narrower) */}
          <div className="md:col-span-7 flex md:justify-end">
            <div className="w-full max-w-[320px] sm:max-w-[420px] md:max-w-[460px] rounded-2xl bg-white/90 backdrop-blur border border-white/40 shadow-xl p-6">
              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
                <span>✨</span>
                <span>Patterns detected</span>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border-l-4 border-emerald-400 bg-emerald-50/70 p-4">
                  <div className="text-emerald-900 font-semibold">Sleep 5/10 → 7/10 when phone stays out of the bedroom</div>
                  <div className="text-emerald-900/80 text-sm mt-1">Insight: Bed becomes for sleeping, not scrolling.</div>
                </div>
                <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-50/70 p-4">
                  <div className="text-indigo-900 font-semibold">Late dinner (after 8:30pm) → +42 min sleep onset</div>
                  <div className="text-indigo-900/80 text-sm mt-1">Insight: Earlier meals settle the night wakings.</div>
                </div>
                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 p-4">
                  <div className="text-amber-900 font-semibold">Wine after 9pm → 3am wake-ups (timing dependent)</div>
                  <div className="text-amber-900/80 text-sm mt-1">Insight: Same drink at 6pm shows no disruption.</div>
                </div>
              </div>
            </div>
          </div>
          {/* Bottom spread content */}
          <div className="md:col-span-12 mt-6 grid md:grid-cols-3 gap-4 text-center md:text-left">
            <div className="text-white/85 text-sm"></div>
            <div className="text-white/85 text-sm"><span className="text-[#F4B860] font-semibold">Your job</span> — 20‑second check‑in daily. You spend longer choosing your socks.</div>
            <div className="flex items-center justify-center md:justify-start gap-6 text-white/85 text-sm">
              <span>✓ No wearable</span>
              <span>✓ First pattern in 7–14 days</span>
            </div>
            {/* Hero proof: compact, specific timing example */}
            <div className="md:col-span-3 mt-4 w-full max-w-3xl md:max-w-4xl mx-auto rounded-xl border border-white/15 bg-white/10 backdrop-blur p-4 md:p-5 flex gap-3 items-start">
              <img src="/girl%20image.png" alt="Ash" className="h-10 w-10 rounded-full object-cover border border-amber-400 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-[13px] md:text-sm text-white/95 italic">“Taking my supplements in the afternoon instead of morning. Such a simple thing. Took me 2 years to figure out — BioStackr found it in 9 days.”</p>
                <p className="text-[11px] md:text-xs text-white/80 mt-1">— Ash, 32, Portland</p>
              </div>
            </div>
            <div className="md:col-span-3 text-center text-[12px] md:text-sm text-white/85">Over 5,000 people have found their sleep trigger with BioStackr.</div>
          </div>
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
            <div className="mt-6">
              <PrimaryCTA />
              
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section id="how-it-works" className="bg-white">
      <Container>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Three steps. One week. Clear answers.</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6 place-items-center md:place-items-stretch">
          {/* Card 1: Log */}
          <div className="w-full max-w-[360px] rounded-2xl border border-amber-200 bg-[#fef3c7] p-6 sm:p-8 md:p-10 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition">
            {/* Visual mockup */}
            <div className="mb-6 h-[220px] sm:h-[260px] md:h-[300px] rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm">
              <div className="h-4 w-1/3 bg-slate-300 rounded mb-3" />
              {/* slider rows */}
              <div className="space-y-3">
                <div className="h-2 rounded w-full" style={{ background: 'linear-gradient(90deg,#ef4444,#f59e0b,#10b981)' }} />
                <div className="h-2 rounded bg-slate-200 w-5/6" />
                <div className="h-2 rounded bg-slate-200 w-2/3" />
              </div>
              {/* tag chips */}
              <div className="mt-5 flex flex-wrap gap-2">
                {['Coffee','Screens','Stress'].map(t=> (
                  <span key={t} className="px-3 py-1 text-xs rounded-full bg-amber-200 text-amber-900 shadow-sm">{t}</span>
                ))}
                {['Exercise','Arguments'].map(t=> (
                  <span key={t} className="px-3 py-1 text-xs rounded-full bg-white border border-slate-300 text-slate-600">{t}</span>
                ))}
              </div>
              {/* bottom button */}
              <div className="mt-5 inline-flex px-4 py-2 rounded-md bg-[#f59e0b] text-black text-xs font-semibold shadow-sm">Log Check‑in</div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">📝 Log — 20 seconds</h3>
            <div className="text-slate-600 leading-relaxed text-[15px] space-y-2">
              <p>Rate your sleep quality (0–10). Tag what you did: coffee, screens, stress, exercise, arguments.</p>
              <p>No journaling. No endless forms. Just: How did you sleep? What did you do?</p>
              <p>Built for 3am when you can’t think straight.</p>
            </div>
          </div>

          {/* Card 2: Elli finds pattern */}
          <div className="w-full max-w-[360px] rounded-2xl border border-purple-200 bg-[#f3e8ff] p-6 sm:p-8 md:p-10 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition">
            {/* Visual mockup */}
            <div className="mb-6 h-[220px] sm:h-[260px] md:h-[300px] rounded-2xl bg-white border border-purple-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500" />
                <div className="h-3 w-24 bg-indigo-300 rounded" />
              </div>
              <div className="relative h-[180px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-purple-100 border border-purple-200 shadow-inner" />
                </div>
                <div className="absolute -top-2 right-0 w-[180px] rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-2 text-xs text-indigo-900 shadow-sm">☕ Coffee after 2pm → Sleep 3/10</div>
                <div className="absolute bottom-0 left-0 w-[190px] rounded-lg border-l-4 border-purple-400 bg-purple-50 p-2 text-xs text-purple-900 shadow-sm">📱 Phone in bedroom → Sleep 4/10</div>
              </div>
              <div className="mt-4 text-[12px] text-slate-600">High confidence • 7 days</div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">🧠 Elli finds the pattern</h3>
            <div className="text-slate-600 leading-relaxed text-[15px] space-y-2">
              <p>After 5–7 days, patterns start appearing:</p>
              <p className="italic text-slate-700">“Coffee after 2pm → Sleep quality drops from 7/10 to 3/10”</p>
              <p className="italic text-slate-700">“Phone in bedroom → Sleep 4/10. Outside → 8/10”</p>
              <p>Not correlation scores. Plain English. Confidence levels shown.</p>
            </div>
          </div>

          {/* Card 3: One change */}
          <div className="w-full max-w-[360px] rounded-2xl border border-emerald-200 bg-[#d1fae5] p-6 sm:p-8 md:p-10 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition">
            {/* Visual mockup */}
            <div className="mb-6 h-[220px] sm:h-[260px] md:h-[300px] rounded-2xl bg-white border border-emerald-200 p-4 sm:p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white p-3 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 mb-1">Before</div>
                  <div className="text-2xl font-bold text-slate-800">4/10</div>
                </div>
                <div className="rounded-lg bg-white p-3 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 mb-1">After</div>
                  <div className="text-2xl font-bold text-emerald-600">8/10</div>
                </div>
              </div>
              <div className="mt-4 h-3 rounded bg-emerald-300 w-3/4" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">✅ One change. One win.</h3>
            <div className="text-slate-600 leading-relaxed text-[15px] space-y-2">
              <p>Move your coffee to morning. Leave phone outside bedroom. Have tough talks before 8pm.</p>
              <p>Test it for 5 days. See if it works for <span className="font-semibold">you</span>.</p>
              <p>One pattern. One week. Better sleep.</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="relative flex items-center justify-between text-slate-700 text-sm">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-slate-200" />
            {['Day 1: Start','Days 3–5: First signals','Days 7–14: First clear pattern'].map((t,i)=> (
              <div key={t} className="relative z-10 flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-slate-400 mb-2" />
                <div>{t}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <PrimaryCTA />
          
        </div>
      </Container>
    </Section>
  );
}

function Testimonials() {
  const items = [
    {
      name: 'Alex, 29 — Insomnia',
      img: '/male 38.png',
      story: [
        "I've had terrible sleep for like 3 years. Tried everything — magnesium, fancy sleep apps, even paid for a sleep coach who told me to 'relax more' which, thanks for nothing.",
        "Started using BioStackr mostly because I was desperate and it was free. After about 2 weeks it flagged that I was eating really late on weeknights (dinner around 9pm because of work). When I ate earlier, even by just an hour, I'd actually fall asleep.",
        "I'm still not perfect but I'm getting like 6 solid hours now instead of 4 broken ones. That's huge for me.",
      ],
    },
    {
      name: 'Lars, 46 — Poor sleep',
      img: '/male image.png',
      story: [
        "Bought an Oura ring last year. Cost me 2,500 kr and basically just confirmed what I already knew — my sleep sucks. Didn't tell me why though.",
        "Someone mentioned this app in a Reddit thread. The AI picked up that my afternoon coffee was the problem. I drink it around 2–3pm thinking it's fine, but apparently it wasn't.",
        "Cut the afternoon coffee, sleep improved. Not like, amazing, but definitely better. Wish I'd known this before spending all that money on a ring.",
      ],
    },
    {
      name: 'Sylvia, 34 — Sleep issues',
      img: '/female 34.png',
      story: [
        "I work late and then go to the gym around 8pm because that's when I have time. Never connected it to my sleep problems until I started tracking everything in here.",
        "The pattern was pretty clear after 10 days or so — late workouts = I'm wired until like 1am. Early morning workouts (even though I hate them) and I'm out by 11.",
        "Still adjusting but at least now I know what the problem is instead of just guessing.",
      ],
    },
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
              <div className="mt-4 space-y-3 text-slate-700 leading-relaxed">
                {t.story.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <PrimaryCTA />
          
        </div>
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
        <div className="mt-8">
          <PrimaryCTA />
          
        </div>
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
            <div className="mt-6">
              <a href="/auth/signup" className="inline-flex rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50">Start Free</a>
              
            </div>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Premium</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">$29 <span className="text-base font-medium text-slate-500">/ month</span></p>
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
          
        </div>
      </Container>
      <div id="get-started" />
    </section>
  );
}

export default function SleepV3Page() {
  return (
    <main className="scroll-smooth">
      {/* New white hero */}
      <section className="relative isolate overflow-hidden bg-white text-slate-900">
        <div className="container mx-auto px-5">
          <div className="pt-20 md:pt-28 pb-10 md:pb-16 grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-7">
              <h1 className="text-4xl md:text-6xl font-semibold leading-tight whitespace-pre-line">{`Still Can’t Sleep?\nWe’ll Show You Why.`}</h1>
              <div className="mt-5 space-y-4 text-lg md:text-xl text-slate-700">
                <p>You’ve tried everything—Ambien, melatonin, weighted blanket, sleep hygiene. Still lying awake at 3am.</p>
                <p>It’s time to see what’s actually keeping <span className="font-semibold">you</span> awake.</p>
                <p>BioStackr connects your habits, stress, and routines—revealing patterns in days, not months.</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <a href="/auth/signup" className="inline-flex items-center justify-center rounded-md bg-[#f59e0b] text-black px-3 py-2 text-sm font-bold hover:bg-[#d97706] transition whitespace-nowrap sm:px-6 sm:py-3 sm:text-base">See What's Keeping You Awake — Free</a>
                <a href="#how-it-works" className="inline-flex items-center justify-center rounded-md border-2 border-black px-3 py-2 text-sm font-semibold hover:bg-black/5 whitespace-nowrap sm:px-6 sm:py-3 sm:text-base">See how it works</a>
              </div>
              <div className="mt-3 text-sm text-slate-600">Get started in 30 seconds - no credit card required.</div>
            </div>
          <div className="md:col-span-5">
            <div className="space-y-4 flex flex-col items-center">
                <div className="w-full max-w-[320px] sm:max-w-[400px] mx-auto rounded-xl border-l-[4px] bg-purple-50 p-6 shadow-sm" style={{ borderLeftColor: '#8b5cf6' }}>
                  <div className="text-xl font-semibold text-purple-900">📱 Phone in bedroom: Sleep 4/10. Phone outside: Sleep 8/10</div>
                  <div className="text-[16px] text-purple-900/80 mt-1">Insight: Leaving it outside turns “bedtime” back into “sleep time.”</div>
                </div>
                <div className="w-full max-w-[320px] sm:max-w-[400px] mx-auto rounded-xl border-l-[4px] bg-blue-50 p-6 shadow-sm" style={{ borderLeftColor: '#6366f1' }}>
                  <div className="text-xl font-semibold text-blue-900">☕ Coffee after 2pm drops your sleep quality from 7/10 to 3/10</div>
                  <div className="text-[16px] text-blue-900/80 mt-1">Insight: Morning coffee fine. Afternoon wrecks your night.</div>
                </div>
                <div className="w-full max-w-[320px] sm:max-w-[400px] mx-auto rounded-xl border-l-[4px] bg-red-50 p-6 shadow-sm" style={{ borderLeftColor: '#ef4444' }}>
                  <div className="text-xl font-semibold text-red-900">💬 Arguments after 9pm drop sleep quality by 40%</div>
                  <div className="text-[16px] text-red-900/80 mt-1">Insight: Tough conversations before bed keep your brain wired all night.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhyDifferent />

      {/* You’ve Tried Everything. Nothing Worked. */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">You’ve Tried Everything. Nothing Worked.</h2>
            <div className="text-[20px] leading-[1.6] text-slate-700 space-y-4">
              <p>Some nights, one thing seems to help. Other nights, the same thing does nothing.</p>
              <p>You don’t have a tracking problem. You have a “why isn’t this working?” problem.</p>
              <p>BioStackr finds the answer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder story (alt background) */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-5 max-w-5xl">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 flex justify-center">
              <Image src="/mum%20photo.png" alt="Ben and his mum" width={300} height={300} className="rounded-xl w-[240px] md:w-[300px] h-auto object-cover" />
            </div>
            <div className="md:col-span-7 text-[16px] md:text-[18px] leading-[1.8] text-slate-800">
              <h3 className="text-2xl md:text-4xl font-bold mb-4">I Built This for My Mum</h3>
              <p className="mb-3">My mum has dealt with chronic pain and chronic sleep issues throughout her life. She's tried everything—different meds, supplements, lifestyle changes, doctors who shrugged.</p>
              <p className="mb-3">But when you're in pain, tracking what helps is almost impossible. You're just trying to get through the day. And at night, when you can't sleep, you're too exhausted to figure out why.</p>
              <p className="mb-3">I watched her struggle for years—more data, more apps, zero answers. She just wanted to know: what actually makes it better? What makes it worse?</p>
              <p className="mb-3">So I built BioStackr.</p>
              <p className="mb-3">Now she can see patterns. She knows what works. Her doctor listens when she shows him the data.</p>
              <p className="mb-6">She's not cured—but she's not guessing anymore. She knows what helps. And some days, that changes everything.</p>
              <p className="italic">— Ben, Founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-5">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">What happens when you finally see patterns</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[{t:'You stop guessing',d:'No more wondering if it was the coffee, the screens, or the stress. Patterns become clear.'},{t:'You sleep through the night',d:'Know exactly what keeps you awake. Finally rest.'},{t:'You wake up energized',d:'One change. One week. Better mornings.'}].map(x=> (
              <div key={x.t} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                <div className="text-emerald-600 font-bold mb-2 text-2xl">✓</div>
                <h3 className="font-semibold mb-2">{x.t}</h3>
                <p className="text-slate-600">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alex story (alt background) */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-5">
          <AlexStoryCard />
        </div>
      </section>

      {/* Keep existing sections */}
      <StepsTimeline />
      {/* Testimonials (alt background) */}
      <section className="bg-gray-50 py-20">
        <Testimonials />
      </section>
      <MorePatterns />
      {/* Pricing (alt background) */}
      <section className="bg-gray-50 py-20">
        <Pricing />
      </section>
      <FinalCTA />
    </main>
  );
}


