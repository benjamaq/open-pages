import Link from "next/link";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Find what's ruining your sleep | BioStackr (V3)",
  description:
    "Most sleep trackers show you how you slept. BioStackr finds what's keeping you awake. No wearable needed. 20 seconds per day.",
};

const brand = {
  bgDarkFrom: "#0c0e1b",
  bgDarkTo: "#20244f",
  glow: "rgba(102, 120, 255, 0.35)",
};

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-6 lg:px-8 ${className}`}>{children}</div>;
}

function CTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(109,99,255,0.45)] transition [background:linear-gradient(135deg,#6a6ff2_0%,#7d5ef9_100%)] hover:shadow-[0_10px_36px_rgba(109,99,255,0.55)]"
    >
      {children}
    </Link>
  );
}

function CTASecondary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

export default function SleepLandingV3() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeroGradient />
      <TrustStrip />
      <GraphsVsAnswers />
      <HowItWorks />
      <ElliVoice />
      <Footer />
    </main>
  );
}

function HeroGradient() {
  return (
    <section className="relative overflow-hidden" aria-label="Find what's ruining your sleep">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(90%_90%_at_70%_0%,#20244f_0%,#0c0e1b_60%)]"
        style={{ backgroundColor: brand.bgDarkFrom }}
      />
      <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full blur-3xl" style={{ background: brand.glow }} />
      <Container className="py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[rgba(255,255,255,0.6)]">
              The next generation of sleep tracking
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Find what’s <span className="text-[rgba(164,172,255,0.95)]">ruining your sleep</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[rgba(255,255,255,0.75)]">
              Most sleep apps show you <em>how</em> you slept. BioStackr finds <strong>what’s disrupting</strong> your sleep—so you can fix it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CTA href="/signup">Start Tracking Sleep</CTA>
              <CTASecondary href="#how">How it works</CTASecondary>
            </div>
            <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[rgba(255,255,255,0.65)]">
              <li>Free to start</li>
              <li className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.25)]" />
              <li>No wearable needed</li>
              <li className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.25)]" />
              <li>~20 seconds per day</li>
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 -z-10 rounded-[36px] bg-[radial-gradient(60%_60%_at_60%_0%,rgba(122,138,255,0.35),transparent)]" />
            <div className="rounded-[36px] border border-white/10 bg-white/10 p-3 backdrop-blur">
              <div className="aspect-[9/19] overflow-hidden rounded-[28px] bg-white shadow-[0_12px_60px_rgba(0,0,0,0.45)] flex items-center justify-center">
                <span className="text-xs text-slate-500">Screenshot Placeholder</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="bg-white">
      <Container className="py-10">
        <p className="mb-4 text-center text-sm text-slate-500">Trusted by people who’ve tried everything</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[{ quote: "After 3 years of guessing, I found the answer in 2 weeks.", name: "Emma", meta: "Fibromyalgia • Seattle" }, { quote: "I’d never have connected the dots. The timing was everything.", name: "Marcus", meta: "Chronic pain • Austin" }, { quote: "Exercise timing was the issue. Now I sleep through the night.", name: "Jordan", meta: "ADHD • Portland" }].map((t, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-[15px] leading-relaxed text-slate-800">“{t.quote}”</p>
              <div className="mt-3 text-sm text-slate-500">
                <span className="font-medium text-slate-700">{t.name}</span> — {t.meta}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function GraphsVsAnswers() {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50/70">
      <Container className="py-16">
        <h2 className="mx-auto max-w-3xl text-center text-3xl font-semibold text-slate-900 sm:text-4xl">
          Sleep trackers show you graphs. <span className="text-indigo-600">We give you answers.</span>
        </h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Other Sleep Trackers</h3>
            <ListItem bad label="Track how you slept" />
            <ListItem bad label="Show sleep graphs" />
            <ListItem bad label="Require wearables" />
            <ListItem bad label="Leave you guessing what to change" />
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-[0_10px_30px_rgba(99,102,241,0.08)]">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">BioStackr</h3>
            <ListItem good label="Find what’s causing bad sleep" />
            <ListItem good label="Track triggers: caffeine, food, stress, exercise timing" />
            <ListItem good label="Works without devices" />
            <ListItem good label='Gives clear actions — like “Skip dairy after 6pm”' />
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
          Insight Screenshot Placeholder
        </div>
      </Container>
    </section>
  );
}

function ListItem({ good, bad, label }: { good?: boolean; bad?: boolean; label: string }) {
  return (
    <div className="mt-3 flex items-start gap-3 text-slate-700">
      <span
        className={
          "mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] " +
          (good ? "bg-green-50 text-green-700 ring-1 ring-green-200" : bad ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-slate-100 text-slate-600")
        }
      >
        {good ? "✓" : "✕"}
      </span>
      <p className="text-[15px] leading-relaxed">{label}</p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, title: "Track Daily (20s)", text: "Rate sleep, mood, pain. Note what you tried." },
    { n: 2, title: "Live Your Life", text: "Keep doing what you’re doing. We watch the patterns." },
    { n: 3, title: "Get Answers", text: "Within ~7–14 days, you’ll see what helps." },
  ];
  return (
    <section id="how" className="bg-slate-50/60">
      <Container className="py-16">
        <h2 className="mb-10 text-center text-3xl font-semibold text-slate-900 sm:text-4xl">How it works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">{s.n}</div>
              <h3 className="mb-1 text-lg font-semibold text-slate-800">{s.title}</h3>
              <p className="text-[15px] text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ElliVoice() {
  return (
    <section className="bg-white">
      <Container className="py-14">
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 text-indigo-900 shadow-sm">
          <div className="mb-2 text-2xl">💙</div>
          <p className="text-[15.5px] leading-relaxed">
            If you’ve tried magnesium, blue blockers, and every hack online—you're not broken. You just haven’t seen the patterns yet. That’s what I’m here for.
          </p>
          <p className="mt-2 text-sm text-indigo-800/80">— Elli</p>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="flex items-center justify-between py-8 text-sm text-slate-500">
        <div>© {new Date().getFullYear()} BioStackr</div>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-slate-700">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-700">Terms</Link>
          <Link href="/contact" className="hover:text-slate-700">Contact</Link>
        </div>
      </Container>
    </footer>
  );
}


