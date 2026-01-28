"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function Page() {
  const [monthlySpend, setMonthlySpend] = useState(247)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (!mounted) return
        setIsAuthed(!!data?.user)
      } catch {
        // ignore
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img
              src="/BIOSTACKR LOGO 2.png"
              alt="BioStackr"
              className="h-10 sm:h-12 w-auto"
            />
          </a>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm text-neutral-600">
              <a href="#pricing" className="hover:text-neutral-900 transition-colors">
                Pricing
              </a>
              <Link href="/contact" className="hover:text-neutral-900 transition-colors">
                Contact
              </Link>
            </div>
            {isAuthed ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    location.href = "/"
                  } catch {}
                }}
              >
                <Button
                  size="sm"
                  className="bg-black text-white hover:bg-neutral-800 hover:scale-105 rounded-full px-5 font-semibold transition-all"
                  type="submit"
                >
                  Sign out
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-neutral-800 hover:scale-105 rounded-full px-5 font-semibold transition-all"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-[#F4B860] text-[#2C2C2C] hover:brightness-95 rounded-full px-5 font-semibold transition-all"
                  >
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative pt-28 pb-10 px-6 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-28 overflow-hidden w-full min-h-[520px] sm:min-h-[600px] lg:min-h-[750px] bg-[#F8F8F8]"
      >
        {/* Desktop/Tablet right-side visual */}
        <div
          className="hidden md:block absolute inset-y-0 right-0 w-1/2"
          style={{
            backgroundImage: "url('/pill bottle.png')",
            backgroundPosition: "right center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative mx-auto max-w-7xl w-full">
          <div className="max-w-xl lg:max-w-2xl">
            <h1 className="mb-3 sm:mb-6 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black leading-[1.1] sm:leading-[1.05] text-center sm:text-left">
              Tinder for Your Supplements.
            </h1>
            <p className="mb-3 sm:mb-6 text-lg sm:text-2xl text-black font-bold leading-relaxed text-center sm:text-left">
              Swipe right on what works. Break up with what doesn’t.
            </p>
            <p className="mb-6 sm:mb-10 text-base sm:text-lg text-neutral-600 leading-relaxed text-center sm:text-left">
              BioStackr shows you what actually works — and what’s just wasting your money.
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 sm:justify-start justify-center">
              <Link href={isAuthed ? "/dashboard" : "/signup"}>
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-neutral-800 hover:scale-105 rounded-full px-7 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold transition-all"
                >
                  {isAuthed ? 'Go to dashboard' : 'Sign up — free'}
                </Button>
              </Link>
              <p className="text-sm text-neutral-500 sm:text-left text-center">Free to start. Wearable optional.</p>
            </div>
            {/* Mobile visual below CTA — artistic crop */}
            <div className="sm:hidden mt-8">
              <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-sm">
                <img
                  src="/pill bottle.png"
                  alt="Supplement bottle"
                  className="absolute inset-0 w-full h-full object-cover object-center scale-110"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials (Proof) */}
      <section
        className="relative py-12 lg:py-16"
        style={{
          backgroundImage: "url('/black.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-6xl px  -6">
          {/* Section header */}
          <div className="text-center mb-8">
            <h2 className="text-[28px] sm:text-[30px] lg:text-[32px] font-semibold tracking-tight text-white">
              The Honeymoon Is Over.
            </h2>
            <p className="mt-2 text-base sm:text-lg text-neutral-300 max-w-xl sm:max-w-2xl mx-auto">
              Because ‘maybe it’s working’ isn’t good enough anymore.
            </p>
          </div>
          {/* Carousel */}
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1"
              style={{ scrollSnapType: 'x mandatory' }}
              onScroll={() => {
                const el = carouselRef.current
                if (!el) return
                const slide = 300 + 16
                const idx = Math.round(el.scrollLeft / slide)
                setTestimonialIndex(Math.min(Math.max(idx, 0), 6))
              }}
            >
              {/* 7 testimonials */}
              <div className="bg-white rounded-2xl p-5 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-xs tracking-widest uppercase text-neutral-500 font-semibold">THE MONEY SAVER</div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-900">
                  Dropped 4 supplements. <span className="font-semibold">Saving €90/month.</span> Should’ve done this years ago.
                </p>
                <p className="mt-3 text-xs text-neutral-600">— Marcus T., saving €90/month</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-xs tracking-widest uppercase text-neutral-500 font-semibold">THE STACK REDUCER</div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-900">
                  From 12 bottles to 3 that actually moved the needle. <span className="font-semibold">Same results, less clutter.</span>
                </p>
                <p className="mt-3 text-xs text-neutral-600">— Jen, dropped 9 supplements</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-xs tracking-widest uppercase text-neutral-500 font-semibold">THE SKEPTIC</div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-900">
                  Thought it was all guesswork. <span className="font-semibold">Only one thing really helped.</span>
                </p>
                <p className="mt-3 text-xs text-neutral-600">— @biohack_ben, Whoop user</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-xs tracking-widest uppercase text-neutral-500 font-semibold">THE BRAND TESTER</div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-900">
                  Same ingredient, two brands. One made a difference, one didn’t. <span className="font-semibold">Now I know which to keep.</span>
                </p>
                <p className="mt-3 text-xs text-neutral-600">— Sophie K., tested 2 brands</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-xs tracking-widest uppercase text-neutral-500 font-semibold">THE SIMPLIFIER</div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-900">
                  <span className="font-semibold">Less really is more.</span> Fewer pills, clearer routine.
                </p>
                <p className="mt-3 text-xs text-neutral-600">— David, simplified his stack</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-xs tracking-widest uppercase text-neutral-500 font-semibold">THE NIGHT SHIFT</div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-900">
                  HRV steadier on the nights I take it. <span className="font-semibold">Fewer 3am crashes.</span>
                </p>
                <p className="mt-3 text-xs text-neutral-600">— ER nurse, nights</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-xs tracking-widest uppercase text-neutral-500 font-semibold">THE REALIST</div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-900">
                  I stopped guessing. <span className="font-semibold">Now I know what’s worth paying for.</span>
                </p>
                <p className="mt-3 text-xs text-neutral-600">— Alex P.</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-xs tracking-widest uppercase text-neutral-500 font-semibold">THE RESET</div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-900">
                  After years of trying everything, I finally <span className="font-semibold">reset to what works.</span>
                </p>
                <p className="mt-3 text-xs text-neutral-600">— Priya, back to basics</p>
              </div>
            </div>
            {/* Arrows */}
            <button
              type="button"
              className="hidden md:flex items-center justify-center absolute -left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 transition"
              aria-label="Previous testimonials"
              onClick={() => {
                const el = carouselRef.current
                if (!el) return
                const slide = 300 + 16
                const next = Math.max(0, testimonialIndex - 1)
                setTestimonialIndex(next)
                el.scrollTo({ left: next * slide, behavior: 'smooth' })
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="hidden md:flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 transition"
              aria-label="Next testimonials"
              onClick={() => {
                const el = carouselRef.current
                if (!el) return
                const slide = 300 + 16
                const next = Math.min(6, testimonialIndex + 1)
                setTestimonialIndex(next)
                el.scrollTo({ left: next * slide, behavior: 'smooth' })
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {/* Slider bar */}
            <div className="mt-6 mx-auto w-48 h-1 bg-white/25 rounded">
              <div
                className="h-full bg-white rounded"
                style={{ width: `${((testimonialIndex + 1) / 7) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Discovery / Uncomfortable Truth Section */}
      <section
        className="relative py-24 lg:py-32 px-6 bg-white overflow-hidden"
        style={{
          backgroundImage: "url('/the match 2.png?v=2')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto max-w-6xl text-center min-h-[520px] lg:min-h-[600px]">
          {/* Reserve space on the right so text doesn't overlap the bottle */}
          <div className="mx-auto max-w-6xl sm:pl-8 md:pl-16 lg:pl-28 xl:pl-48 lg:pr-[22%]">
          {/* Split headline for rhythm */}
          <h2 className="text-black font-semibold leading-tight tracking-tight">
            <span className="block text-4xl sm:text-5xl lg:text-5xl lg:whitespace-nowrap mb-4">
              Everyone&apos;s looking for &quot;The One.&quot;
            </span>
            <span className="block text-3xl sm:text-4xl lg:text-4xl lg:whitespace-nowrap">
              We help you find the 3–5 that actually work. (Or 15. No judgement.)
            </span>
          </h2>
          {/* Subheader with breathing room */}
          <p className="mt-6 mb-12 text-xl lg:text-2xl text-neutral-700 leading-relaxed font-medium">
            It takes years to find the right partner. Your supplements? About two weeks.
          </p>
          {/* White container: wider, aligned to hero text, anchored toward bottle */}
          <div className="mt-6 rounded-2xl bg-white/95 backdrop-blur px-10 py-8 shadow-sm">
            {/* Three-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-left">
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">THE PROBLEM</div>
                <p className="text-[17px] md:text-[18px] text-neutral-800">Reddit isn&apos;t research.</p>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">THE REALITY</div>
                <p className="text-[17px] md:text-[18px] text-neutral-800">Most supplement advice is vibes, anecdotes, or influencer chemistry.</p>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">THE FIX</div>
                <p className="text-[17px] md:text-[18px] text-neutral-800">
                  You test them.<br />
                  You measure them.<br />
                  You keep the ones that show up.
                </p>
              </div>
            </div>
            {/* Divider + calm callout */}
            <div className="border-t border-neutral-200 mt-6 pt-6">
              <div className="mx-auto max-w-3xl rounded-2xl bg-white/95 border border-neutral-300 px-6 py-5 text-center">
                <p className="text-neutral-800"><span className="font-semibold">65–75%</span> of supplements show no measurable effect.</p>
                <p className="text-neutral-700 mt-1">Your data tells the truth. Marketing doesn&apos;t.</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* How Much Are You Spending Section (Calculator) */}
      <section
        id="calculator"
        className="py-24 lg:py-32 px-6 bg-no-repeat bg-center bg-cover relative"
        style={{
          backgroundImage: "url('/cash.png?v=2')",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div className="mx-auto max-w-5xl relative z-10">
          <h2 className="mb-3 text-center text-black font-semibold leading-tight tracking-tight">
            <span className="block text-4xl sm:text-5xl lg:text-5xl mb-4">
              The Average Divorce Costs $15,000.
            </span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl lg:whitespace-nowrap">
              Ten Years With the Wrong Supplements? About the Same.
            </span>
          </h2>
          <p className="mb-10 text-lg sm:text-xl lg:text-2xl text-neutral-800 font-medium text-center">
            Let&apos;s talk about the relationship you&apos;ve been quietly paying for.
          </p>

          {/* Context copy above calculator */}
          <div className="mx-auto max-w-xl text-center space-y-2 mb-10">
            <p className="text-lg sm:text-xl text-neutral-800">
              You&apos;re not sure it&apos;s working. But you&apos;re not sure it isn&apos;t.
            </p>
            <p className="text-lg sm:text-xl text-neutral-800">
              So you keep paying. Month after month. Year after year.
            </p>
          </div>

          {/* Input + Calculation */}
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-neutral-200">
              <div className="flex items-end justify-between mb-3">
                <label className="block text-base sm:text-lg text-neutral-700">
                  What&apos;s your current supplement relationship costing you?
                </label>
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900">${monthlySpend}</div>
              </div>
              <input
                type="range"
                min={0}
                max={400}
                step={5}
                value={monthlySpend}
                onChange={(e) => setMonthlySpend(Number(e.target.value) || 0)}
                className="w-full accent-black"
              />
              <div className="mt-2 flex justify-between text-xs text-neutral-500">
                <span>$0</span>
                <span>$200</span>
                <span>$400</span>
              </div>
            </div>

            {/* Yearly Waste (assume ~50% waste) */}
            <div className="bg-neutral-100 rounded-2xl p-10 text-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm sm:text-base text-neutral-600 mb-2">Estimated wasted per year</div>
                  <div className="text-4xl sm:text-5xl font-bold text-neutral-900">
                    ${Math.round(monthlySpend * 12 * 0.5).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm sm:text-base text-neutral-600 mb-2">Estimated wasted over 10 years</div>
                  <div className="text-4xl sm:text-5xl font-bold text-neutral-900">
                    ${Math.round(monthlySpend * 12 * 0.5 * 10).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-lg text-neutral-600 leading-relaxed">
                For supplements you&apos;re not actually sure are doing anything.
              </p>
              <div className="pt-2">
                <Button className="bg-black hover:bg-neutral-800 text-white rounded-full px-6 py-3 font-semibold">
                  Find out which ones are worth keeping →
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Small decorative image at bottom-right (keeps existing bg, adds subtle accent) */}
        <img
          src="/final.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute right-4 bottom-6 w-24 sm:w-40 md:w-48"
        />
      </section>

      {/* Getting to Know Each Other (How It Works) */}
      <section
        id="how-it-works"
        className="py-24 lg:py-28 px-6 bg-[#faf9f7]"
        style={{
          backgroundImage: "url('/how to.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto w-full max-w-6xl">
          {/* Section header (headline + subhead on background, no containers) */}
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900">
              This is your real-life experiment.
            </h2>
            <p className="mt-4 text-lg font-medium text-neutral-700 max-w-3xl mx-auto leading-snug">
              Supplements don’t work in isolation. They reveal themselves — or don’t — through missed doses, bad sleep, stress, and inconsistency.
              <br />
              BioStackr measures how each one performs in your real life, so you know which ones are worth committing to, and which ones aren’t.
            </p>
          </div>

          {/* Core explanation — wrapped in a SINGLE white container */}
          <div className="mt-8 rounded-2xl bg-white/95 backdrop-blur px-8 py-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
              {/* Column 1 */}
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500">WHAT YOU DO</div>
                <div className="mt-4 text-sm text-neutral-700 leading-relaxed space-y-3">
                  <p><span className="font-semibold">Tell us what you’re taking.</span> Your stack, what you’re taking it for, and what it costs you each month.</p>
                  <p><span className="font-semibold">Check in briefly.</span> Sleep, energy, mood. Three sliders. About ten seconds.</p>
                  <p><span className="font-semibold">Flag unusual days (optional).</span> Alcohol, illness, travel, high stress — one tap.</p>
                </div>
              </div>
              {/* Column 2 */}
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500">WHAT WE DO</div>
                <div className="mt-4 text-sm text-neutral-700 leading-relaxed space-y-3">
                  <p><span className="font-semibold">Compare better days to worse ones.</span> Days with a supplement vs days without.</p>
                  <p><span className="font-semibold">Account for noise.</span> Disrupted days don’t distort the signal.</p>
                  <p><span className="font-semibold">Let patterns form naturally.</span> No forced protocols. No artificial rules.</p>
                </div>
              </div>
              {/* Column 3 */}
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500">WHAT YOU GET</div>
                <div className="mt-4 text-sm text-neutral-700 leading-relaxed space-y-3">
                  <p><span className="font-semibold">Matched</span> — earning its place. Keep it.</p>
                  <p><span className="font-semibold">Swipe left</span> — no measurable benefit. Drop it.</p>
                  <p><span className="font-semibold">Situationship</span> — promising, but needs more data.</p>
                  <p className="text-neutral-600 italic">No guesswork. Just clarity.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline / progress card — separate white container */}
          <div className="mt-10 max-w-2xl mx-auto rounded-2xl bg-white/95 backdrop-blur px-8 py-6 shadow-sm text-center">
            <p className="text-sm font-semibold text-neutral-900">How progress unfolds</p>
            <div className="mt-2 text-sm text-neutral-600 space-y-1">
              <div><span className="font-semibold">Day 1</span> — Your stack is mapped. Progress starts immediately.</div>
              <div><span className="font-semibold">Week 1</span> — Clear direction begins to form.</div>
              <div><span className="font-semibold">Week 2+</span> — Confident verdicts start landing.</div>
              <div><span className="font-semibold">Ongoing</span> — Confidence compounds as patterns repeat.</div>
            </div>
          </div>

          {/* NOTE: No pricing CTA, no dashboard metrics, no supplement lists in this section */}
        </div>
      </section>

      {/* (Calculator moved above How It Works) */}

      {/* Supplement Dating Profiles Section */}
      <section
        className="py-24 lg:py-32 px-6 bg-white"
        style={{
          backgroundImage: "url('/spotlight.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl">
          <h2
            className="text-4xl lg:text-5xl font-bold tracking-tight text-white text-center leading-tight"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          >
            We Need to Talk
          </h2>
          <p
            className="mt-3 mb-16 text-center text-[#d0d0d0] text-xl lg:text-2xl font-medium"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
          >
            Here&apos;s what your data says. No hard feelings.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Vitamin D3 Card */}
            <Card
              className="overflow-hidden border border-neutral-200 transition-all bg-[#faf9f7] rounded-2xl"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="p-6">
                {/* Status chip on top */}
                <div className="mb-3">
                  <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                    MATCHED
                  </Badge>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-black mb-1">Vitamin D3</h3>
                  <p className="text-xs text-neutral-600">5000 IU Daily</p>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Compatibility</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-800" style={{ width: "89%" }} />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">89%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <Clock className="h-3 w-3" />
                    <span>4 months together</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-2">Reliable. Shows up. Your energy scores are 23% better since you committed.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-neutral-900">$138</span>
                    <span className="text-xs text-neutral-500">invested</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Magnesium Card */}
            <Card
              className="overflow-hidden border border-neutral-200 transition-all bg-[#faf9f7] rounded-2xl"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="p-6">
                {/* Status chip on top */}
                <div className="mb-3">
                  <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                    SWIPED LEFT
                  </Badge>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-black mb-1">Magnesium Glycinate</h3>
                  <p className="text-xs text-neutral-600">400mg Before Bed</p>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Compatibility</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-800" style={{ width: "22%" }} />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">22%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <Clock className="h-3 w-3" />
                    <span>6 months together</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-2">Six months and your deep sleep hasn&apos;t budged. This one&apos;s coasting.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-neutral-900">$174</span>
                    <span className="text-xs text-neutral-500">wasted</span>
                  </div>
                  <p className="mt-2 text-[11px] italic text-neutral-500">It&apos;s not you. It&apos;s your magnesium.</p>
                </div>
              </div>
            </Card>

            {/* Ashwagandha Card */}
            <Card
              className="overflow-hidden border border-neutral-200 transition-all bg-[#faf9f7] rounded-2xl"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="p-6">
                {/* Status chip on top */}
                <div className="mb-3">
                  <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                    SITUATIONSHIP
                  </Badge>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-black mb-1">Ashwagandha</h3>
                  <p className="text-xs text-neutral-600">600mg Morning</p>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Compatibility</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-800" style={{ width: "54%" }} />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">54%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <Clock className="h-3 w-3" />
                    <span>2 months together</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-2">
                    Stress is lower, but your energy dipped. Worth investigating.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-neutral-900">$47</span>
                    <span className="text-xs text-neutral-500">spent</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Fish Oil Card */}
            <Card
              className="overflow-hidden border border-neutral-200 transition-all bg-[#faf9f7] rounded-2xl"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="p-6">
                {/* Status chip on top */}
                <div className="mb-3">
                  <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                    MATCHED
                  </Badge>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-black mb-1">Fish Oil</h3>
                  <p className="text-xs text-neutral-600">2000mg Daily</p>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Compatibility</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-800" style={{ width: "76%" }} />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">76%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <Clock className="h-3 w-3" />
                    <span>8 months together</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-2">Quiet but consistent. Joint pain down. Recovery up. The strong, silent type.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-neutral-900">$128</span>
                    <span className="text-xs text-neutral-500">invested</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* We Don't Do Gut Feelings — Credibility Section */}
      <section
        className="py-24 lg:py-28 px-6"
        style={{
          backgroundImage: "url('/row.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-black text-center leading-tight">
            We Don&apos;t Do Gut Feelings.
          </h2>
          <div className="mt-4 flex justify-center">
            <div className="bg-white/95 backdrop-blur rounded-xl px-5 py-4 max-w-2xl">
              <p className="text-base sm:text-lg text-neutral-800 leading-snug text-center">
                Same methods used in clinical trials. Now for your supplement drawer.
              </p>
            </div>
          </div>

          {/* Credibility card */}
          <div className="mt-10 bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 lg:p-10">
            {/* Cohen's d box */}
            <div className="space-y-3">
            <div className="text-xs tracking-widest uppercase font-semibold text-neutral-600">
                COHEN&apos;S D EFFECT SIZING
              </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900">
                The statistical gold standard for measuring whether something actually works.
              </h3>
            <p className="text-base text-neutral-700">
                It&apos;s how researchers separate real results from placebo. We apply the same rigor to your magnesium.
              </p>
            <p className="text-base text-neutral-900 font-semibold">
                No vibes. No guessing. Just math that holds up.
              </p>
            </div>

            {/* Credibility points */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="text-base text-neutral-800">
                <span className="font-semibold">ON vs OFF comparison</span> — We compare how you feel on days with a supplement vs days without — not just trends over time
              </div>
            <div className="text-base text-neutral-800">
              <span className="font-semibold">Noise filtering</span> — Stress, alcohol, illness — excluded from the signal
              </div>
            <div className="text-base text-neutral-800">
              <span className="font-semibold">Confidence thresholds</span> — We don&apos;t call it until the data is clear
              </div>
            <div className="text-base text-neutral-800">
              <span className="font-semibold">Effect size, not just correlation</span> — Big enough to matter, not just statistically present
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8">
              <p className="text-xs text-neutral-500 italic text-center">
                This is correlation-based analysis, not a clinical trial. But it&apos;s the closest thing your stack has ever had to peer review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For Section */}
      <section
        className="py-24 lg:py-32 px-6"
        style={{
          backgroundImage: "url('/2 bottles 2.png?v=1')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-5xl">
          {/* Reserve space on the left for bottles so text never overlaps at 100% zoom */}
          <div className="pl-1 lg:pl-[28%] xl:pl-[32%] 2xl:pl-[36%]">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-black leading-tight">
              Are We Compatible?
            </h2>
            <p className="mt-3 mb-16 text-neutral-800 text-lg sm:text-xl lg:text-2xl font-medium">
              Let&apos;s find out before this gets awkward.
            </p>
            <div className="flex justify-center md:pl-16 lg:pl-0">
              <div className="grid md:grid-cols-2 gap-12 lg:gap-16 max-w-4xl">
                {/* For You If */}
                <div>
                  <h3 className="text-2xl font-bold text-black mb-6">Green flags:</h3>
                  <ul className="space-y-4">
                    <li className="text-lg text-neutral-700 leading-relaxed">You spend €50–€150/month and wonder if it&apos;s worth it</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You track sleep, energy, or recovery — even casually</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You&apos;d rather know than hope</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You&apos;re willing to break up with what isn&apos;t working</li>
                  </ul>
                </div>

                {/* Not For You If */}
                <div>
                  <h3 className="text-2xl font-bold text-black mb-6">Red flags:</h3>
                  <ul className="space-y-4">
                    <li className="text-lg text-neutral-700 leading-relaxed">Your love language is denial</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You think &quot;I feel like it&apos;s working&quot; is evidence</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You&apos;d rather not know the truth</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You want every supplement to be &quot;the one&quot;</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="mt-12 md:pl-16 lg:pl-0 text-neutral-800 text-lg sm:text-xl font-medium">No judgment. But if you&apos;re still here, you already know.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 lg:py-32 px-6 bg-neutral-50"
        style={{
          backgroundImage: "url('/last.png?v=1')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-black text-center leading-tight">Commitment Issues? Start Free.</h2>
          <p className="mt-4 mb-16 text-xl lg:text-2xl text-neutral-800 text-center font-medium">You can stay casual forever. But if you want real answers, they&apos;re here when you&apos;re ready.</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Card className="border border-neutral-200 shadow-sm bg-white p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Starter</h3>
                <p className="text-sm text-neutral-600">$0/month</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold text-black">$0</span>
                <span className="text-neutral-600">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Track up to 3 supplements</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Manual check-ins</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Basic pattern insights</span>
                </li>
              </ul>

              <Link href="/signup">
                <Button className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-full py-6 font-semibold">
                  Start Casual →
                </Button>
              </Link>
            </Card>

            {/* Pro Tier */}
            <Card className="border-2 border-black shadow-lg bg-white p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-black text-white hover:bg-black px-4 py-1 font-semibold">POPULAR</Badge>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Premium</h3>
                <p className="text-sm text-neutral-600">$19/month</p>
              </div>

              <div className="mb-2">
                <span className="text-5xl font-bold text-black">$19</span>
                <span className="text-neutral-600">/month</span>
              </div>
              <div className="text-sm text-neutral-700 mb-6">or <span className="font-semibold">$149/year</span> <span className="text-neutral-500">• $12.42/mo • Billed annually</span></div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Unlimited supplements</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Wearable data analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Cohen&apos;s d effect sizing</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Full Breakup Reports</span>
                </li>
              </ul>

              <Link href="/signup?plan=premium">
                <Button className="w-full bg-black hover:bg-neutral-800 text-white rounded-full py-6 font-semibold">
                  Get Answers →
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        className="py-24 lg:py-32 px-6 bg-white"
        style={{
          backgroundImage: "url('/guess.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-3xl text-center bg-black/85 rounded-2xl p-8 sm:p-10">
          <h2 className="mb-6 text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Stop Guessing. Start Knowing.
          </h2>
          <p className="mb-10 text-xl text-neutral-200 leading-relaxed">
            See which supplements are actually making a difference—and which ones you can finally let go.
          </p>
          <Button
            size="lg"
            className="bg-transparent border-2 border-white text-white hover:bg-white/10 hover:scale-105 rounded-full px-12 py-6 text-lg font-semibold transition-all"
          >
            Get Your Break-Up Report
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm text-neutral-500">
              © 2025 BioStackr. This is not medical advice. Consult a healthcare provider before making supplement
              changes.
            </div>
            <div className="flex items-center gap-6 text-sm text-neutral-600">
              <a href="#" className="hover:text-neutral-900 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-neutral-900 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-neutral-900 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
