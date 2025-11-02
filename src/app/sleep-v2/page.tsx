import Link from "next/link";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Find what's ruining your sleep | BioStackr",
  description:
    "Most sleep trackers show you how you slept. BioStackr finds what's keeping you awake. No wearable needed. 20 seconds per day.",
};

// ========================================
// REUSABLE COMPONENTS
// ========================================

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-6 lg:px-8 ${className}`}>{children}</div>;
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`py-20 lg:py-28 ${className}`}>{children}</section>;
}

function PrimaryButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg bg-[#E8B86D] px-8 py-4 text-base font-semibold text-black transition-all hover:bg-[#d9a860] focus:outline-none focus:ring-2 focus:ring-[#E8B86D] focus:ring-offset-2"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg border-2 border-gray-700 px-8 py-4 text-base font-semibold text-gray-300 transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
    >
      {children}
    </Link>
  );
}

// ========================================
// MAIN PAGE
// ========================================

export default function SleepLandingV2() {
  return (
    <main className="bg-white">
      
      {/* ========================================
          HERO SECTION - DARK
          ======================================== */}
      <Section className="bg-[#1A1A1A]">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            
            {/* LEFT: Copy */}
            <div>
              <p className="mb-6 text-xs font-medium uppercase tracking-wider text-gray-400">
                For people who can't sleep
              </p>
              
              <h1 className="mb-6 text-5xl font-bold leading-tight text-white lg:text-6xl">
                Find what's ruining
                <br />
                your sleep.
              </h1>
              
              <p className="mb-8 text-xl leading-relaxed text-gray-300">
                Most sleep trackers show you <em>how</em> you slept. BioStackr finds{" "}
                <strong>what's keeping you awake</strong>.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row">
                <PrimaryButton href="/signup">Start Tracking Sleep</PrimaryButton>
                <SecondaryButton href="#how-it-works">How It Works</SecondaryButton>
              </div>
              
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#E8B86D]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free to start
                </span>
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#E8B86D]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  No wearable
                </span>
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#E8B86D]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  20 seconds per day
                </span>
              </div>
            </div>
            
            {/* RIGHT: Hero Image */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="aspect-[4/3] bg-gray-300 rounded-2xl flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Hero Image</span>
                </div>
              </div>
            </div>
            
          </div>
        </Container>
      </Section>

      {/* ========================================
          SOCIAL PROOF - WHITE
          ======================================== */}
      <Section className="bg-white">
        <Container>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-black lg:text-4xl">
              Trusted by people who've tried everything
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            
            {/* Testimonial 1 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <blockquote className="mb-6 text-lg leading-relaxed text-gray-900">
                "After 3 years of guessing, I found the answer in 2 weeks."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Emma</span>
                </div>
                <div>
                  <p className="font-semibold text-black">Emma</p>
                  <p className="text-sm text-gray-500">Fibromyalgia · Seattle</p>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm text-[#E8B86D] font-semibold">
                  Sleep improved from 4/10 → 8/10
                </p>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <blockquote className="mb-6 text-lg leading-relaxed text-gray-900">
                "I'd never have connected the dots. The timing was everything."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Marcus</span>
                </div>
                <div>
                  <p className="font-semibold text-black">Marcus</p>
                  <p className="text-sm text-gray-500">Chronic pain · Austin</p>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm text-[#E8B86D] font-semibold">
                  Found caffeine cutoff in 4 days
                </p>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <blockquote className="mb-6 text-lg leading-relaxed text-gray-900">
                "Exercise timing was the issue. Now I sleep through the night."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Jordan</span>
                </div>
                <div>
                  <p className="font-semibold text-black">Jordan</p>
                  <p className="text-sm text-gray-500">ADHD · Portland</p>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm text-[#E8B86D] font-semibold">
                  Pattern found in 7 days
                </p>
              </div>
            </div>
            
          </div>
        </Container>
      </Section>

      {/* ========================================
          DIFFERENTIATION - LIGHT GRAY
          ======================================== */}
      <Section className="bg-[#F5F5F5]">
        <Container>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-black lg:text-4xl">
              Most apps show graphs. We show answers.
            </h2>
          </div>
          
          <div className="grid gap-12 lg:grid-cols-2">
            
            {/* Left: Other Apps */}
            <div>
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Other Sleep Trackers</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Track your sleep</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Show REM cycles</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Require wearables</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Give you more data</span>
                </li>
              </ul>
            </div>
            
            {/* Right: BioStackr */}
            <div>
              <h3 className="mb-6 text-xl font-semibold text-black">BioStackr</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#E8B86D]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-900">Find what disrupts sleep</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#E8B86D]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-900">Identify triggers (caffeine, stress, food)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#E8B86D]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-900">Works without devices</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#E8B86D]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-900">Give you clear answers</span>
                </li>
              </ul>
            </div>
            
          </div>
          
          <div className="mt-12 flex justify-center">
            <div className="w-[600px] max-w-full">
              <div className="aspect-[3/2] bg-gray-300 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-gray-500 text-sm">App Screenshot Placeholder</span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ========================================
          HOW IT WORKS - WHITE
          ======================================== */}
      <Section id="how-it-works" className="bg-white">
        <Container>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-black lg:text-4xl">
              How it works
            </h2>
            <p className="text-xl text-gray-600">Simple enough for your worst days</p>
          </div>
          
          <div className="grid gap-12 md:grid-cols-3">
            
            {/* Step 1 */}
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#E8B86D]">
                <span className="text-2xl font-bold text-black">1</span>
              </div>
              <h3 className="mb-4 text-xl font-semibold text-black">Track Daily (20s)</h3>
              <p className="text-gray-600 leading-relaxed">
                Rate sleep, mood, pain. Note what you tried.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#E8B86D]">
                <span className="text-2xl font-bold text-black">2</span>
              </div>
              <h3 className="mb-4 text-xl font-semibold text-black">Live Your Life</h3>
              <p className="text-gray-600 leading-relaxed">
                Keep doing what you're doing. We watch the patterns.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#E8B86D]">
                <span className="text-2xl font-bold text-black">3</span>
              </div>
              <h3 className="mb-4 text-xl font-semibold text-black">Get Answers</h3>
              <p className="text-gray-600 leading-relaxed">
                Usually within 7-14 days, you'll see what helps.
              </p>
            </div>
            
          </div>
        </Container>
      </Section>

      {/* ========================================
          PATTERNS - DARK
          ======================================== */}
      <Section className="bg-[#1A1A1A]">
        <Container>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              What people discovered
            </h2>
            <p className="text-xl text-gray-400">Real patterns from real users</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Pattern Card 1 */}
            <div className="rounded-2xl bg-[#262626] p-8">
              <div className="mb-4 text-4xl">☕</div>
              <h3 className="mb-2 text-xl font-semibold text-white">The 2pm Caffeine Rule</h3>
              <p className="mb-4 text-sm font-semibold text-[#E8B86D]">
                Sleep onset: 3 hours → 45 minutes
              </p>
              <p className="text-gray-400 leading-relaxed">
                When I stopped coffee after lunch, I fell asleep naturally.
              </p>
            </div>
            
            {/* Pattern Card 2 */}
            <div className="rounded-2xl bg-[#262626] p-8">
              <div className="mb-4 text-4xl">🌙</div>
              <h3 className="mb-2 text-xl font-semibold text-white">The Magnesium Effect</h3>
              <p className="mb-4 text-sm font-semibold text-[#E8B86D]">
                Sleep quality: 4/10 → 8/10
              </p>
              <p className="text-gray-400 leading-relaxed">
                3 nights of magnesium glycinate changed everything.
              </p>
            </div>
            
            {/* Pattern Card 3 */}
            <div className="rounded-2xl bg-[#262626] p-8">
              <div className="mb-4 text-4xl">🏃</div>
              <h3 className="mb-2 text-xl font-semibold text-white">Exercise Timing</h3>
              <p className="mb-4 text-sm font-semibold text-[#E8B86D]">
                Evening workouts = 2hr sleep delay
              </p>
              <p className="text-gray-400 leading-relaxed">
                Moving workouts to morning solved my sleep onset issues.
              </p>
            </div>
            
            {/* Pattern Card 4 */}
            <div className="rounded-2xl bg-[#262626] p-8">
              <div className="mb-4 text-4xl">😰</div>
              <h3 className="mb-2 text-xl font-semibold text-white">Stress Timing</h3>
              <p className="mb-4 text-sm font-semibold text-[#E8B86D]">
                Cortisol peaks = poor sleep 4-6hrs later
              </p>
              <p className="text-gray-400 leading-relaxed">
                High-stress days showed up as wired nights.
              </p>
            </div>
            
            {/* Pattern Card 5 */}
            <div className="rounded-2xl bg-[#262626] p-8">
              <div className="mb-4 text-4xl">🧀</div>
              <h3 className="mb-2 text-xl font-semibold text-white">The Dairy Discovery</h3>
              <p className="mb-4 text-sm font-semibold text-[#E8B86D]">
                Night wakings reduced by 60%
              </p>
              <p className="text-gray-400 leading-relaxed">
                Cutting dairy at dinner eliminated middle-of-night wakings.
              </p>
            </div>
            
            {/* Pattern Card 6 */}
            <div className="rounded-2xl bg-[#262626] p-8">
              <div className="mb-4 text-4xl">📱</div>
              <h3 className="mb-2 text-xl font-semibold text-white">Blue Light Effect</h3>
              <p className="mb-4 text-sm font-semibold text-[#E8B86D]">
                Screen time after 10pm = 45min delay
              </p>
              <p className="text-gray-400 leading-relaxed">
                Phones down by 9:30pm = deep sleep 45 minutes sooner.
              </p>
            </div>
            
          </div>
          
          <div className="mt-12 text-center">
            <PrimaryButton href="/signup">Start Free — See Your Own Patterns</PrimaryButton>
          </div>
        </Container>
      </Section>

      {/* ========================================
          CTA - WHITE, CENTERED
          ======================================== */}
      <Section className="bg-white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-4xl font-bold text-black lg:text-5xl">
              Ready to understand your sleep?
            </h2>
            <p className="mb-8 text-xl text-gray-600">
              Start tracking today. See patterns in 7-14 days.
            </p>
            <PrimaryButton href="/signup">Start Free — No Credit Card</PrimaryButton>
            <p className="mt-6 text-sm text-gray-500">
              Used by 47 people this week
            </p>
          </div>
        </Container>
      </Section>

      {/* ========================================
          FOOTER - LIGHT GRAY
          ======================================== */}
      <footer className="bg-[#F5F5F5] py-12">
        <Container>
          <div className="text-center">
            <p className="mb-4 text-sm text-gray-600">
              Built by Ben in Copenhagen 🇩🇰
            </p>
            <div className="flex justify-center gap-6">
              <Link href="/contact" className="text-gray-600 hover:text-black transition">
                Contact
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-black transition">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-black transition">
                Terms
              </Link>
            </div>
          </div>
        </Container>
      </footer>
      
    </main>
  );
}


