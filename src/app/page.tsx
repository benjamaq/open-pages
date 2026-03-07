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
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')

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

      {/* Hero Section - Mobile only */}
      <section
        className="sm:hidden relative pt-28 pb-10 px-6 overflow-hidden w-full bg-[#F8F8F8]"
      >
        <div className="mx-auto max-w-xl">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-black leading-[1.1] text-center">
            Stop Paying for Supplements
            <span className="block">That Don&apos;t Work.</span>
          </h1>
          <p className="mb-6 text-base text-neutral-700 leading-relaxed text-center">
            Connect your Oura, WHOOP, or Apple Health and get your first KEEP or DROP verdict in 2 minutes using your historical data.
          </p>
          <div className="flex flex-col items-center justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-black text-white hover:bg-neutral-800 hover:scale-105 rounded-full px-7 py-5 text-base font-semibold transition-all"
              >
                Test My Supplements
              </Button>
            </Link>
            <p className="mt-3 text-sm text-neutral-500 text-center">Upload your Apple Health, WHOOP or Oura data and we&apos;ll do the rest.</p>
          </div>
          {/* Full‑bleed hero image below text */}
          <div className="-mx-6 mt-8">
            <img
              src="/pill-bottle.png"
              alt="Supplement bottle"
              className="w-screen h-[48vh] object-cover object-[90%_40%]"
              loading="eager"
            />
          </div>
        </div>
      </section>
      {/* Hero Section - Desktop/Tablet (unchanged from original) */}
      <section
        className="hidden sm:block relative pt-32 pb-20 px-6 lg:pt-40 lg:pb-28 overflow-hidden w-full min-h-[600px] lg:min-h-[750px]"
        style={{
          backgroundImage: "url('/pill-bottle.png')",
          backgroundPosition: "right center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#F8F8F8",
        }}
      >
        <div className="mx-auto max-w-7xl w-full">
          <div className="max-w-xl lg:max-w-2xl">
            <h1 className="mb-8 text-6xl lg:text-7xl font-bold tracking-tight text-black leading-[1.05]">
              Stop Paying for Supplements
              <span className="block">That Don&apos;t Work.</span>
            </h1>
            <p className="mb-10 text-xl text-neutral-700 leading-relaxed">
              Connect your Oura, WHOOP, or Apple Health and get your first KEEP or DROP verdict in 2 minutes using your historical data.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-neutral-800 hover:scale-105 rounded-full px-8 py-6 text-lg font-semibold transition-all"
                >
                  Test My Supplements
                </Button>
              </Link>
              <p className="text-sm text-neutral-500">Upload your Apple Health, WHOOP or Oura data and we&apos;ll do the rest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Stack Analysis — new section for instant perceived value */}
      <section className="py-20 lg:py-28 px-6 bg-[#faf9f7]">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 text-center leading-tight">
            Know Your Stack in 60 Seconds
          </h2>
          <p className="mt-4 text-xl text-neutral-700 text-center max-w-2xl mx-auto">
            The moment you add your supplements, BioStackr analyses your stack and shows you:
          </p>

          {/* Three value cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur p-6 shadow-sm">
              <div className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">Stack Economics</div>
              <h3 className="text-lg font-bold text-black">Your exact spend</h3>
              <p className="mt-2 text-neutral-700 text-sm leading-relaxed">
                Monthly and annual spend on supplements. Most users are surprised.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur p-6 shadow-sm">
              <div className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">Evidence Breakdown</div>
              <h3 className="text-lg font-bold text-black">Clinical backing</h3>
              <p className="mt-2 text-neutral-700 text-sm leading-relaxed">
                Which supplements have strong clinical backing — and which have almost none.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur p-6 shadow-sm">
              <div className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">What To Test First</div>
              <h3 className="text-lg font-bold text-black">Ranked by cost</h3>
              <p className="mt-2 text-neutral-700 text-sm leading-relaxed">
                By cost and uncertainty. We tell you where to focus so you stop guessing.
              </p>
            </div>
          </div>

          {/* Stack Snapshot mockup */}
          <div className="mt-12 max-w-lg mx-auto rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur p-6 shadow-sm">
            <p className="text-sm font-semibold text-neutral-900 mb-4">Your Stack Snapshot</p>
            <div className="space-y-3 text-sm text-neutral-800">
              <div className="flex justify-between">
                <span>Monthly spend:</span>
                <span className="font-semibold">€184/mo</span>
              </div>
              <div className="flex justify-between">
                <span>Annual spend:</span>
                <span className="font-semibold">€2,208/yr</span>
              </div>
              <div className="pt-3 border-t border-neutral-200">
                <p className="text-neutral-600 mb-2">Evidence strength:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-600 w-24 shrink-0">Strong evidence</span>
                    <span className="flex-1 h-2 bg-neutral-200 rounded overflow-hidden"><span className="block h-full w-2/5 bg-neutral-800" /></span>
                    <span className="shrink-0">2 supplements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-600 w-24 shrink-0">Moderate evidence</span>
                    <span className="flex-1 h-2 bg-neutral-200 rounded overflow-hidden"><span className="block h-full w-2/5 bg-neutral-600" /></span>
                    <span className="shrink-0">1 supplement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-600 w-24 shrink-0">Weak/no evidence</span>
                    <span className="flex-1 h-2 bg-neutral-200 rounded overflow-hidden"><span className="block h-full w-3/5 bg-neutral-400" /></span>
                    <span className="shrink-0">3 supplements</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-neutral-200 flex justify-between">
                <span>Potential monthly saving:</span>
                <span className="font-semibold text-neutral-900">~€74</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-neutral-600 text-center">Ready to find out which ones actually work?</p>
            <div className="mt-4">
              <Link href="/signup">
                <Button className="w-full bg-black hover:bg-neutral-800 text-white rounded-full py-3 font-semibold">
                  Start My Analysis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Stuff Nobody Tells You (Stats) */}
      <section
        className="relative py-16 lg:py-20 px-6"
        style={{
          backgroundImage: "url('/new back.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-block rounded-2xl bg-black/70 backdrop-blur-sm px-6 py-5">
              <h2 className="text-[28px] sm:text-[32px] lg:text-[36px] font-semibold tracking-tight text-white">
                Most Supplement Users See Little to No Effect.
              </h2>
              <p className="mt-2 text-base sm:text-lg text-neutral-200 max-w-2xl mx-auto">
                The average supplement user spends €2,000+ per year. Research suggests most are seeing little to no measurable effect from the majority of what they take.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-sm p-6">
              <div className="text-2xl sm:text-3xl font-semibold text-white">Your money. Your results.</div>
              <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                Independent research often finds supplements fail to match their labels — wrong dose, wrong ingredient, or no active ingredient at all. The question isn&apos;t what&apos;s in the bottle. It&apos;s whether it&apos;s doing anything for you.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-sm p-6">
              <div className="text-2xl sm:text-3xl font-semibold text-white">
                Many show little to no measurable effect.
              </div>
              <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                In clinical research, many supplements show little or no measurable effect. And that&apos;s the ones that actually contain what they claim. The real question: what&apos;s working for your body?
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-sm p-6">
              <div className="text-2xl sm:text-3xl font-semibold text-white">No testing required before sale.</div>
              <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                The FDA does not test, review, or approve any supplement before it reaches your door. The label is whatever the manufacturer decided to print. You can&apos;t control what&apos;s in the bottle — but you can measure whether it&apos;s doing anything for you.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-sm p-6">
              <div className="text-2xl sm:text-3xl font-semibold text-white">Stop guessing. Start testing.</div>
              <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                Add your supplements. Use your existing health data — Apple Health, WHOOP, Oura — or check in at your own pace. Let the data tell you what to keep and what to drop.
              </p>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <div className="rounded-xl bg-black/70 backdrop-blur-sm px-6 py-4 max-w-3xl text-center">
              <p className="text-sm sm:text-base text-white">
                Every bottle in your stack reached you without a single independent quality check. Your data tells the truth.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-black text-white hover:bg-neutral-800 hover:scale-105 rounded-full px-8 py-6 text-lg font-semibold transition-all"
              >
                Test What You&apos;re Actually Taking
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Supplement Verdict Cards — Vitamin D3 KEEP, Magnesium DROP, Ashwagandha TESTING */}
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
            Your data doesn&apos;t care what the label says.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Vitamin D3 Card */}
            <Card
              className="overflow-hidden border border-neutral-200 transition-all bg-[#faf9f7] rounded-2xl"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="p-6">
                <div className="mb-3">
                  <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                    KEEP
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
                <div className="mb-3">
                  <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                    DROP
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
                  <p className="text-xs text-neutral-600 mb-2">Six months and your recovery hasn&apos;t budged. This one&apos;s coasting.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-neutral-900">$174</span>
                    <span className="text-xs text-neutral-500">wasted</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Ashwagandha Card */}
            <Card
              className="overflow-hidden border border-neutral-200 transition-all bg-[#faf9f7] rounded-2xl"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="p-6">
                <div className="mb-3">
                  <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                    TESTING
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
                <div className="mb-3">
                  <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                    KEEP
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
                  <p className="text-xs text-neutral-600 mb-2">Quiet but consistent. Recovery up. The strong, silent type.</p>
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

      {/* Already Tracking Your Health? — Wearable section */}
      <section className="py-24 lg:py-28 px-6 bg-[#faf9f7]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
            Already Tracking Your Health?
          </h2>
          <p className="mt-4 text-xl text-neutral-700 max-w-2xl mx-auto">
            If you use Apple Health, WHOOP, or Oura — you already have the data. BioStackr uses your existing history to generate insights fast. No waiting around.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-10">
            <div className="rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur px-6 py-4 min-w-[140px]">
              <span className="font-semibold text-neutral-900">Apple Health</span>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur px-6 py-4 min-w-[140px]">
              <span className="font-semibold text-neutral-900">WHOOP</span>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur px-6 py-4 min-w-[140px]">
              <span className="font-semibold text-neutral-900">Oura Ring</span>
            </div>
          </div>

          <p className="mt-8 text-neutral-700 max-w-xl mx-auto">
            Upload your data during signup and we&apos;ll analyse your supplement history against your sleep, recovery and energy scores automatically.
          </p>

          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="bg-black hover:bg-neutral-800 text-white rounded-full px-8 py-4 text-base font-semibold">
                Upload My Data & Get Started
              </Button>
            </Link>
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
              Because &apos;I think it&apos;s working&apos; isn&apos;t evidence.
            </p>
          </div>
          {/* Carousel */}
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1"
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
              <div className="bg-white rounded-2xl p-6 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-500/80 font-semibold">
                  Identifying supplements that weren’t contributing
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-900">
                  Dropped 4 supplements. <span className="font-semibold">Saving €90/month.</span> Should’ve done this years ago.
                </p>
                <p className="mt-4 text-[12px] text-neutral-500">— Marcus T., saving €90/month</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-500/80 font-semibold">
                  Reducing the stack without losing results
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-900">
                  From 12 bottles to 3 that actually moved the needle. <span className="font-semibold">Same results, less clutter.</span>
                </p>
                <p className="mt-4 text-[12px] text-neutral-500">— Jen, dropped 9 supplements</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-500/80 font-semibold">
                  Isolating what actually made a difference
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-900">
                  Thought it was all guesswork. <span className="font-semibold">Only one thing really helped.</span>
                </p>
                <p className="mt-4 text-[12px] text-neutral-500">— @biohack_ben, Whoop user</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-500/80 font-semibold">
                  Different brands can perform differently
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-900">
                  Same ingredient, two brands. One made a difference, one didn’t. <span className="font-semibold">Now I know which to keep.</span>
                </p>
                <p className="mt-4 text-[12px] text-neutral-500">— Sophie K., tested 2 brands</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-500/80 font-semibold">
                  Reducing complexity in the daily routine
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-900">
                  <span className="font-semibold">Less really is more.</span> Fewer pills, clearer routine.
                </p>
                <p className="mt-4 text-[12px] text-neutral-500">— David, simplified his stack</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-500/80 font-semibold">
                  Sleep consistency on demanding schedules
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-900">
                  HRV steadier on the nights I take it. <span className="font-semibold">Fewer 3am crashes.</span>
                </p>
                <p className="mt-4 text-[12px] text-neutral-500">— ER nurse, nights</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-500/80 font-semibold">
                  Clarifying what’s worth paying for
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-900">
                  I stopped guessing. <span className="font-semibold">Now I know what’s worth paying for.</span>
                </p>
                <p className="mt-4 text-[12px] text-neutral-500">— Alex P.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm w-[300px] snap-start shrink-0">
                <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-500/80 font-semibold">
                  Resetting after years of trial and error
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-900">
                  After years of trying everything, I finally <span className="font-semibold">reset to what works.</span>
                </p>
                <p className="mt-4 text-[12px] text-neutral-500">— Priya, back to basics</p>
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
              Anyone Can Start a Supplement Brand.
            </span>
            <span className="block text-3xl sm:text-4xl lg:text-4xl lg:whitespace-nowrap">
              And They Do.
            </span>
          </h2>
          {/* Subheader with breathing room */}
          <p className="mt-8 mb-12 text-xl lg:text-2xl text-neutral-700 leading-relaxed font-medium">
            Anyone can buy bulk supplements, bottle them, and sell them with a clean label. Almost nothing stops them.
          </p>
          {/* White container: wider, aligned to hero text, anchored toward bottle */}
          <div className="mt-6 rounded-2xl bg-white/95 backdrop-blur px-10 py-8 shadow-sm">
            {/* Three-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-left">
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">THE PROBLEM</div>
                <p className="text-[17px] md:text-[18px] text-neutral-800 font-semibold">You don&apos;t know who made this.</p>
                <p className="mt-2 text-[15px] md:text-[16px] text-neutral-700 leading-relaxed">
                  Someone buys bulk supplements from a factory overseas. Bottles them. Builds a clean website. Lists them on Amazon. You see five-star
                  reviews and next-day delivery. You click Buy Now. Nobody tested what&apos;s inside. Not the seller. Not Amazon. Not the FDA.
                  Nobody.
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">THE REALITY</div>
                <p className="text-[17px] md:text-[18px] text-neutral-800 font-semibold">This is what you&apos;re actually taking.</p>
                <p className="mt-2 text-[15px] md:text-[16px] text-neutral-700 leading-relaxed">
                  Lab tests consistently find supplements with the wrong dose, the wrong ingredient, or no active ingredient at all. Roughly
                  half of products tested on Amazon failed to match their own label. Some contained contaminants. Some contained unlisted
                  drugs. Many supplements show little or no measurable effect in clinical research. And that&apos;s the ones that actually contain
                  what they claim.
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">THE FIX</div>
                <p className="text-[17px] md:text-[18px] text-neutral-800 font-semibold">Stop trusting labels. Start testing.</p>
                <p className="mt-2 text-[15px] md:text-[16px] text-neutral-700 leading-relaxed">
                  You can&apos;t control what&apos;s in the bottle. But you can measure whether it&apos;s doing anything for your body. Add your
                  supplements. Use your existing health data or check in at your own pace. Let the data tell you what to keep and what to throw away.
                </p>
              </div>
            </div>
            {/* Divider + calm callout + single CTA */}
            <div className="border-t border-neutral-200 mt-6 pt-6">
              <div className="mx-auto max-w-3xl rounded-2xl bg-white/95 border border-neutral-200 px-6 py-5 text-center">
                <p className="text-neutral-800">Every bottle in your stack reached you without an independent quality check.</p>
                <p className="text-neutral-700 mt-1">Your data tells the truth. Labels don&apos;t.</p>
                <div className="mt-5">
                  <Link href="/signup">
                    <Button className="bg-black hover:bg-neutral-800 text-white rounded-full px-6 py-3 font-semibold">
                      Test My Supplements
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* How Much Are You Spending Section (Calculator) - Mobile */}
      <section
        id="calculator"
        className="sm:hidden py-20 px-6 relative"
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <div className="mx-auto max-w-5xl relative z-10">
          <h2 className="mb-3 text-center text-black font-semibold leading-tight tracking-tight">
            <span className="block text-4xl mb-4">
              You&apos;ll Spend Enough on Supplements
            </span>
            <span className="block text-2xl">
              to Buy a Car.
            </span>
          </h2>
          <p className="mb-8 text-lg text-neutral-800 font-medium text-center">
            At $300/month, that&apos;s $36,000 over the next decade. How much of that is doing absolutely nothing?
          </p>
          {/* Input + Calculation */}
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200">
              <div className="flex items-end justify-between mb-3">
                <label className="block text-base text-neutral-700">
                  How much do you spend on supplements each month?
                </label>
                <div className="text-2xl font-bold text-neutral-900">${monthlySpend}</div>
              </div>
              <input
                type="range"
                min={0}
                max={400}
                step={5}
                value={monthlySpend}
                onChange={(e) => setMonthlySpend(Number(e.target.value) || 0)}
                aria-describedby="spend-slider-hint"
                className="w-full accent-black cursor-pointer"
              />
              <div className="mt-1 flex justify-center">
                <span id="spend-slider-hint" className="text-[12px] text-neutral-700">
                  Slide to adjust
                </span>
              </div>
              <div className="mt-2 flex justify-between text-xs text-neutral-500">
                <span>$0</span>
                <span>$200</span>
                <span>$400</span>
              </div>
            </div>
            {/* Yearly Waste */}
            <div className="bg-neutral-100 rounded-2xl p-8 text-center">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <div className="text-sm text-neutral-600 mb-2">Estimated wasted per year</div>
                  <div className="text-4xl font-bold text-neutral-900">
                    ${Math.round(monthlySpend * 12 * 0.5).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-2">Estimated wasted over 10 years</div>
                  <div className="text-4xl font-bold text-neutral-900">
                    ${Math.round(monthlySpend * 12 * 0.5 * 10).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat callouts */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
                <div className="text-4xl font-bold text-neutral-900">55%</div>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                  of best-sellers in one supplement category on Amazon contained little to no active ingredient
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
                <div className="text-4xl font-bold text-neutral-900">5 out of 39</div>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                  products in another popular category actually contained what the label promised
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
                <div className="text-4xl font-bold text-neutral-900">Zero</div>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                  the number of supplements the FDA tests before they hit shelves
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-lg text-neutral-800 leading-relaxed bg-white rounded-xl px-6 py-4 border border-neutral-200">
                That&apos;s for supplements you haven&apos;t tested, from brands you haven&apos;t verified, based on advice from people who don&apos;t know you.
              </p>
              <div className="pt-2">
                <Link href="/signup">
                  <Button className="bg-black hover:bg-neutral-800 text-white rounded-full px-6 py-3 font-semibold">
                    Find Out Which Ones Are Worth Keeping
                  </Button>
                </Link>
              </div>
            </div>
            {/* Image below text for mobile — full-bleed */}
            <div className="-mx-6 mt-4">
              <img
                src="/cash.png?v=2"
                alt="Money spilling from supplement bottle"
                className="w-screen h-[50vh] object-cover object-[90%_55%]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How Much Are You Spending Section (Calculator) - Desktop/Tablet (unchanged) */}
      <section
        className="hidden sm:block py-24 lg:py-32 px-6 bg-no-repeat bg-center bg-cover relative"
        style={{
          backgroundImage: "url('/cash.png?v=2')",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div className="mx-auto max-w-5xl relative z-10">
          <h2 className="mb-3 text-center text-black font-semibold leading-tight tracking-tight">
            <span className="block text-4xl sm:text-5xl lg:text-5xl mb-4">
              You&apos;ll Spend Enough on Supplements
            </span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl lg:whitespace-nowrap">
              to Buy a Car.
            </span>
          </h2>
          <p className="mb-10 text-lg sm:text-xl lg:text-2xl text-neutral-800 font-medium text-center">
            At $300/month, that&apos;s $36,000 over the next decade. How much of that is doing absolutely nothing?
          </p>

          {/* Input + Calculation */}
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-neutral-200">
              <div className="flex items-end justify-between mb-3">
                <label className="block text-base sm:text-lg text-neutral-700">
                  How much do you spend on supplements each month?
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
                aria-describedby="spend-slider-hint-desktop"
                className="w-full accent-black cursor-pointer"
              />
              <div className="mt-1 flex justify-center">
                <span id="spend-slider-hint-desktop" className="text-[12px] text-neutral-700">
                  Slide to adjust
                </span>
              </div>
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

            {/* Stat callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
                <div className="text-4xl font-bold text-neutral-900">55%</div>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                  of best-sellers in one supplement category on Amazon contained little to no active ingredient
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
                <div className="text-4xl font-bold text-neutral-900">5 out of 39</div>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                  products in another popular category actually contained what the label promised
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
                <div className="text-4xl font-bold text-neutral-900">Zero</div>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                  the number of supplements the FDA tests before they hit shelves
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-lg text-neutral-800 leading-relaxed bg-white rounded-xl px-6 py-4 border border-neutral-200">
                That&apos;s for supplements you haven&apos;t tested, from brands you haven&apos;t verified, based on advice from people who don&apos;t know you.
              </p>
              <div className="pt-2">
                <Link href="/signup">
                  <Button className="bg-black hover:bg-neutral-800 text-white rounded-full px-6 py-3 font-semibold">
                    Find Out Which Ones Are Worth Keeping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative image removed per feedback */}
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
              Test One Supplement. Or Your Whole Stack.
            </h2>
            <p className="mt-4 text-lg font-medium text-neutral-700 max-w-3xl mx-auto leading-snug">
              Your data. Your biology. Real answers.
            </p>
          </div>

          {/* Core explanation — wrapped in a SINGLE white container */}
          <div className="mt-8 rounded-2xl bg-white/95 backdrop-blur px-8 py-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
              {/* Column 1 */}
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500">WHAT YOU DO</div>
                <div className="mt-4 text-sm text-neutral-700 leading-relaxed space-y-3">
                  <p><span className="font-semibold">Add your supplements.</span></p>
                  <p>Upload your Apple Health, WHOOP or Oura data — or check in at your own pace. Sleep, energy, mood, focus.</p>
                  <p>Using your existing health data? Insights can come faster than you&apos;d expect.</p>
                  <p>Flag unusual days (illness, travel, stress) so they don&apos;t skew your results.</p>
                </div>
              </div>
              {/* Column 2 */}
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500">WHAT WE DO</div>
                <div className="mt-4 text-sm text-neutral-700 leading-relaxed space-y-3">
                  <p>Compare your health on days WITH a supplement vs days WITHOUT.</p>
                  <p>Filter out noise — stress, alcohol, bad nights excluded automatically.</p>
                  <p>Run the same statistical methods used in clinical trials.</p>
                </div>
              </div>
              {/* Column 3 */}
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-gray-500">WHAT YOU GET</div>
                <div className="mt-4 text-sm text-neutral-700 leading-relaxed space-y-3">
                  <p><span className="font-semibold">KEEP</span> — measurable positive effect. Worth your money.</p>
                  <p><span className="font-semibold">DROP</span> — no effect. Stop paying for it.</p>
                  <p><span className="font-semibold">TESTING</span> — signal forming. Needs more data.</p>
                  <p className="text-neutral-600 italic">No opinions. No influencers. Just your data.</p>
                </div>
              </div>
            </div>
          </div>

          {/* What Users Discover — outcomes, not process */}
          <div className="mt-10 max-w-2xl mx-auto rounded-2xl bg-white/95 backdrop-blur px-8 py-6 shadow-sm">
            <p className="text-sm font-semibold text-neutral-900 text-center">What Users Discover</p>
            <div className="mt-4 text-sm text-neutral-600 text-left space-y-3">
              <p>&quot;I had no idea I was spending €220/month.&quot;</p>
              <p>&quot;Magnesium was doing absolutely nothing for my sleep.&quot;</p>
              <p>&quot;Fish oil is the only one worth keeping.&quot;</p>
            </div>
            <p className="mt-3 text-xs text-neutral-500 text-center italic">Stories from real users — based on their data, their body, their supplements.</p>
          </div>

          {/* NOTE: No pricing CTA, no dashboard metrics, no supplement lists in this section */}
        </div>
      </section>

      {/* What People Are Finding Out — Real Discoveries */}
      <section
        className="py-24 lg:py-28 px-6"
        style={{
          backgroundImage: "url('/row.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-black text-center leading-tight">
            What People Are Finding Out
          </h2>
          <p className="mt-4 text-lg text-neutral-700 text-center max-w-2xl mx-auto">
            Real verdicts from real users. Human, specific, money-focused.
          </p>

          {/* Outcome cards — match supplement card styling */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-sm" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div className="mb-3">
                <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                  DROP
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-black">Magnesium Glycinate</h3>
              <p className="mt-2 text-sm text-neutral-700 italic">&quot;No measurable effect on my sleep after 6 weeks.&quot;</p>
              <p className="mt-3 text-sm font-semibold text-neutral-900">Saving €22/month</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-sm" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div className="mb-3">
                <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                  KEEP
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-black">Fish Oil</h3>
              <p className="mt-2 text-sm text-neutral-700 italic">&quot;Recovery scores improved consistently during the testing period.&quot;</p>
              <p className="mt-3 text-sm font-semibold text-neutral-900">Worth every penny</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-sm" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div className="mb-3">
                <Badge className="bg-black text-white border-transparent uppercase rounded-full font-semibold px-3 py-1.5 text-[11px]">
                  DROP
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-black">Ashwagandha</h3>
              <p className="mt-2 text-sm text-neutral-700 italic">&quot;Energy levels were actually lower on days I took it.&quot;</p>
              <p className="mt-3 text-sm font-semibold text-neutral-900">Saving €34/month</p>
            </div>
          </div>

          <p className="mt-8 text-center text-neutral-700 max-w-2xl mx-auto">
            These aren&apos;t generic findings. They&apos;re personal — based on your data, your body, your supplements.
          </p>
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
              Is This For You?
            </h2>
            <p className="mt-3 mb-16 text-neutral-800 text-lg sm:text-xl lg:text-2xl font-medium">
              Honest answer: not for everyone.
            </p>
            <div className="flex justify-center md:pl-16 lg:pl-0">
              <div className="grid md:grid-cols-2 gap-12 lg:gap-16 max-w-4xl">
                {/* For You If */}
                <div>
                  <h3 className="text-2xl font-bold text-black mb-6">YES:</h3>
                  <ul className="space-y-4">
                    <li className="text-lg text-neutral-700 leading-relaxed">You spend $100–$400 a month on supplements</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You&apos;ve wondered whether half your stack is doing anything</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You own a wearable or you&apos;re willing to check in at your own pace</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You&apos;d rather know than guess</li>
                  </ul>
                </div>

                {/* Not For You If */}
                <div>
                  <h3 className="text-2xl font-bold text-black mb-6">NO:</h3>
                  <ul className="space-y-4">
                    <li className="text-lg text-neutral-700 leading-relaxed">You think &quot;I feel like it works&quot; is good enough</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You&apos;ve never questioned a single supplement you take</li>
                    <li className="text-lg text-neutral-700 leading-relaxed">You&apos;d rather keep spending than find out the truth</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="mt-12 md:pl-16 lg:pl-0 text-neutral-800 text-lg sm:text-xl font-medium">
              If you&apos;re still reading, you already know which column you&apos;re in.
            </p>
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
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-black text-center leading-tight mb-12">
            Start Free. One Dropped Supplement Pays for the Year.
          </h2>

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
                  <span className="text-neutral-700">Up to 3 supplements</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Apple Health, WHOOP & Oura upload</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Instant Stack Economics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">KEEP/DROP/TESTING verdicts</span>
                </li>
              </ul>

              <Link href="/signup?plan=free">
                <Button className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-full py-6 font-semibold">
                  Start Free
                </Button>
              </Link>
            </Card>

            {/* Pro Tier */}
            <Card className="border-2 border-black shadow-lg bg-white p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-black text-white hover:bg-black px-4 py-1 font-semibold">POPULAR</Badge>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Pro</h3>
                <div className="mt-2 flex justify-start">
                  <div className="inline-flex rounded-full border border-neutral-300 bg-neutral-100 overflow-hidden shadow-sm">
                    <button
                      type="button"
                      aria-pressed={billingPeriod === 'monthly'}
                      onClick={() => setBillingPeriod('monthly')}
                      className={`px-3 py-1.5 text-xs font-medium transition ${
                        billingPeriod === 'monthly'
                          ? 'bg-white text-neutral-900'
                          : 'bg-transparent text-neutral-600 hover:text-neutral-800'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      aria-pressed={billingPeriod === 'yearly'}
                      onClick={() => setBillingPeriod('yearly')}
                      className={`px-3 py-1.5 text-xs font-medium transition border-l border-neutral-300 ${
                        billingPeriod === 'yearly'
                          ? 'bg-white text-neutral-900'
                          : 'bg-transparent text-neutral-600 hover:text-neutral-800'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <span className="text-5xl font-bold text-black">
                  {billingPeriod === 'monthly' ? '$19' : '$149'}
                </span>
                <span className="text-neutral-600">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
              </div>
              <div className="text-sm text-neutral-700 mb-6">or <span className="font-semibold">$149/year</span> <span className="text-neutral-500">• $12.42/mo • Billed annually</span></div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Unlimited supplements</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Full history analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Email reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-neutral-700">Priority insights</span>
                </li>
              </ul>

              <Link href={`/signup?plan=premium&period=${billingPeriod}`}>
                <Button className="w-full bg-black hover:bg-neutral-800 text-white rounded-full py-6 font-semibold">
                  Get Answers
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
            Stop Guessing. Start Testing.
          </h2>
          <p className="mb-10 text-xl text-neutral-200 leading-relaxed">
            You&apos;ve spent years building your stack. Spend two minutes testing it.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 hover:scale-105 rounded-full px-12 py-6 text-lg font-semibold transition-all"
            >
              Test My Supplements
            </Button>
          </Link>
          <p className="mt-4 text-sm text-neutral-200">Free. No credit card required.</p>
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
