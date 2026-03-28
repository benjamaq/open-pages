'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

export default function CohortsPage() {
  const [formData, setFormData] = useState({
    name: '',
    brandProduct: '',
    email: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Required'
    if (!formData.brandProduct.trim()) newErrors.brandProduct = 'Required'
    if (!formData.email.trim()) newErrors.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsSubmitting(true)
    setSubmitSuccess(false)
    try {
      const res = await fetch('/api/cohort-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setSubmitSuccess(true)
        setFormData({ name: '', brandProduct: '', email: '', message: '' })
      } else {
        setErrors({ submit: 'Something went wrong. Please try again.' })
      }
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Section 1 — Hero */}
      <section
        className="relative pt-20 sm:pt-36 pb-12 sm:pb-28 px-4 sm:px-6 overflow-hidden w-full min-h-[420px] sm:min-h-[680px] lg:min-h-[750px]"
        style={{
          backgroundImage: "url('/amber.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#1a1a1a",
        }}
      >
        {/* Gradient overlay: stronger on left for text, image shows through on right */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.25) 100%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl lg:max-w-2xl sm:text-left text-center">
            <h1 className="mb-4 sm:mb-6 text-3xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Prove your product does what you claim.
            </h1>
            {/* Proof strip — label + stat chips */}
            <div className="mb-6 sm:mb-8">
              <p className="text-[10px] sm:text-xs font-medium text-white/60 uppercase tracking-wider mb-2 sm:mb-3">Example BioStackr cohort result</p>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
                {[
                  { stat: '47', label: 'participants' },
                  { stat: '18', label: 'wearable data uploads' },
                  { stat: '74%', label: 'reported improved sleep' },
                  { stat: 'd = 0.71', label: 'Large effect size' },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-2.5 py-2 sm:px-4 sm:py-3 min-w-0 text-center"
                  >
                    <p className="text-sm sm:text-lg font-bold text-white">{chip.stat}</p>
                    <p className="text-[10px] sm:text-xs text-white/70">{chip.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mb-8 sm:mb-12 text-base sm:text-2xl text-neutral-200 leading-relaxed">
              Measure the exact outcomes your product claims to improve, using real customer data, and turn that into claim-ready evidence for ads, landing pages, and retail.
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4">
              <button
                type="button"
                onClick={scrollToContact}
                className="inline-flex items-center justify-center rounded-full px-6 sm:px-10 py-3.5 sm:py-6 text-sm sm:text-lg font-semibold bg-white text-black hover:bg-neutral-100 active:scale-[0.98] sm:hover:scale-105 transition-all whitespace-nowrap min-h-[44px] sm:min-h-[48px] touch-manipulation"
                style={{ color: '#000' }}
              >
                Request a study overview
              </button>
              <a
                href="/BioStackr_Sample_Report_Final.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/95 hover:text-white underline underline-offset-4 text-sm sm:text-base font-medium"
              >
                Download sample report
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1b — Configurable outcomes */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-white">
        <div className="relative mx-auto max-w-6xl">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 text-center mb-4 sm:mb-6">
            Built around your product, not generic metrics
          </h2>
          <p className="text-center text-neutral-700 max-w-3xl mx-auto mb-10 sm:mb-14 text-base sm:text-lg leading-relaxed">
            Every study is configured to measure the outcomes your product is designed to improve, not generic wellness scores.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <h3 className="text-xl font-bold text-black mb-3">Sleep</h3>
              <ul className="text-neutral-700 text-base leading-relaxed space-y-2 list-disc pl-5">
                <li>Sleep quality</li>
                <li>Time to fall asleep</li>
                <li>Night wake-ups</li>
                <li>Morning energy</li>
              </ul>
            </Card>
            <Card
              className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <h3 className="text-xl font-bold text-black mb-3">Gut</h3>
              <ul className="text-neutral-700 text-base leading-relaxed space-y-2 list-disc pl-5">
                <li>Digestive comfort</li>
                <li>Bloating</li>
                <li>Energy after eating</li>
                <li>Mood</li>
              </ul>
            </Card>
            <Card
              className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <h3 className="text-xl font-bold text-black mb-3">Cognitive</h3>
              <ul className="text-neutral-700 text-base leading-relaxed space-y-2 list-disc pl-5">
                <li>Focus</li>
                <li>Mental clarity</li>
                <li>Mood stability</li>
                <li>Energy</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 2 — The Transformation */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6"
        style={{
          backgroundImage: "url('/pill-bottle.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto max-w-6xl">
          <h2 className="hidden lg:block text-2xl sm:text-4xl font-bold tracking-tight text-white text-center mb-10 sm:mb-16">
            From this — to this.
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-0 items-stretch">
            {/* Mobile: "from this" label */}
            <p className="lg:hidden text-center text-white font-bold text-2xl mb-1">from this</p>
            {/* Before panel */}
            <div className="rounded-2xl lg:rounded-r-none border border-neutral-200 bg-neutral-100/95 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-4">Before BioStackr</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-600 leading-tight mb-6 italic">
                &ldquo;Our customers love this product.&rdquo;
              </p>
              <p className="text-neutral-600 text-base leading-relaxed">
                Unverifiable. Ignored by serious buyers.
              </p>
            </div>
            {/* Arrow divider — vertical on mobile, horizontal on desktop */}
            <div className="flex justify-center items-center py-4 lg:py-8 lg:px-4">
              <ArrowRight className="w-6 h-6 lg:w-8 lg:h-8 text-white/80 rotate-90 lg:rotate-0" aria-hidden />
            </div>
            {/* Mobile: "to this" label */}
            <p className="lg:hidden text-center text-white font-bold text-2xl mb-1">to this</p>
            {/* After panel — no border, warm off-white, subtle shadow only */}
            <div className="rounded-2xl lg:rounded-l-none bg-[#faf9f7] p-6 sm:p-8 lg:p-10 flex flex-col justify-center" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <p className="text-xs font-semibold tracking-wider uppercase text-neutral-600 mb-4">After a BioStackr study</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black leading-tight mb-4">
                &ldquo;74% of participants reported better sleep within 21 days.&rdquo;
              </p>
              <p className="text-base text-neutral-700 leading-relaxed mb-4">
                Based on real customer tracking across the cohort.
              </p>
              <p className="text-sm text-neutral-600 mb-2">47 participants · 30 days · 1,034 check-ins</p>
              <p className="text-lg font-semibold text-neutral-900 mb-2">Credible. Claim-ready. Yours.</p>
              <p className="text-base text-neutral-700 leading-relaxed">
                Real customers. Wearable-verified data. Real statistical analysis.
              </p>
            </div>
          </div>
          <p className="mt-12 text-center text-lg text-white max-w-2xl mx-auto leading-relaxed">
            That is the difference between marketing that sounds good and marketing that is backed by evidence.
          </p>
        </div>
      </section>

      {/* Section 3 — The Problem */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6"
        style={{
          backgroundImage: "url('/new back.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto max-w-6xl">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white text-center mb-10 sm:mb-14">
            The evidence gap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-sm p-6">
              <h3 className="text-xl font-bold text-white mb-3">Reviews don&apos;t convert</h3>
              <p className="text-neutral-300 text-base leading-relaxed">
                Retail buyers increasingly ignore star ratings when evaluating supplement claims.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-sm p-6">
              <h3 className="text-xl font-bold text-white mb-3">Clinical trials aren&apos;t realistic</h3>
              <p className="text-neutral-300 text-base leading-relaxed">
                Randomised trials cost $200k–$2M and take 1–3 years.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-sm p-6">
              <h3 className="text-xl font-bold text-white mb-3">There has been no middle ground</h3>
              <p className="text-neutral-300 text-base leading-relaxed">
                Until now: no structured way to collect real-world product outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — How It Works */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6"
        style={{
          backgroundImage: "url('/how to.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-center mb-10 sm:mb-14">
            From customers to claim-ready evidence in 30 days
          </h2>
          {/* Pipeline bar — six phases */}
          <div className="mb-8 overflow-x-auto">
            <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-max px-4 py-2 rounded-lg bg-[#faf9f7]/90 border border-neutral-200/80 mx-auto w-fit">
              {['Recruit', 'Enroll', 'Ship', 'Track', 'Analyse', 'Evidence'].map((label, i) => (
                <span key={label} className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-neutral-700">{label}</span>
                  {i < 5 && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-400 shrink-0" aria-hidden />}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 sm:p-8 lg:p-12 shadow-xl max-w-4xl mx-auto">
              <div className="space-y-0">
                {[
                  { num: 1, title: 'You invite your customers', body: 'BioStackr provides the study invitation and enrollment page. You send it to your existing customer list.' },
                  { num: 2, title: 'We select high-quality customers to form a clean cohort', body: 'Interested customers apply through a BioStackr study page. We review and select participants so your data reflects the outcomes your product claims to improve.' },
                  { num: 3, title: 'You ship the product', body: 'BioStackr sends you the confirmed participant list. You ship a 30-day supply of the product being studied.' },
                  { num: 4, title: 'Customers track the exact outcomes your product claims to improve', body: 'Participants complete daily check-ins tailored to your study — not generic wellness scores — with optional wearable data (Oura, Apple Health, WHOOP) for objective metrics. BioStackr manages reminders and compliance throughout.' },
                  { num: 5, title: 'Outcome analysis', body: 'BioStackr runs full statistical analysis on those outcomes: effect sizes, confidence intervals, and cohort-level distributions you can stand behind in marketing and retail.' },
                  { num: 6, title: 'Claim-ready evidence delivered', body: 'You receive an executive summary, full dataset report, and claim-ready marketing language — evidence shaped around your product claims, ready for Meta ads and retail pitches within two weeks of study end.' },
                ].map((step, i) => (
                <div
                  key={step.num}
                  className={`flex gap-4 sm:gap-6 lg:gap-8 py-5 sm:py-6 lg:py-8 ${i < 5 ? 'border-b border-neutral-200' : ''}`}
                >
                  <span className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-base sm:text-lg lg:text-xl font-bold bg-amber-600 text-white">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">{step.title}</h3>
                    <p className="text-neutral-700 text-base leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
              </div>
          </div>
        </div>
      </section>

      {/* Section 4b — Fit */}
      <section
        className="relative py-14 sm:py-20 px-4 sm:px-6 border-y border-neutral-200/40 overflow-hidden"
        style={{
          backgroundImage: "url('/new back.jpg')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/55" aria-hidden />
        <div className="relative mx-auto max-w-4xl">
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-center mb-8"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
          >
            Best suited for
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
              <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Works best for</p>
              <p className="text-neutral-700 text-base mb-4 leading-relaxed">
                Products with measurable short-term outcomes:
              </p>
              <ul className="text-neutral-800 text-base leading-relaxed space-y-2 list-disc pl-5">
                <li>Sleep</li>
                <li>Energy</li>
                <li>Focus</li>
                <li>Recovery</li>
                <li>Mood</li>
                <li>Digestive comfort</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
              <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Less suited for</p>
              <ul className="text-neutral-800 text-base leading-relaxed space-y-2 list-disc pl-5">
                <li>Blood markers</li>
                <li>Long-term longevity claims</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — What You Receive */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6"
        style={{
          backgroundImage: "url('/spotlight.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative mx-auto max-w-6xl">
          <h2
            className="text-2xl sm:text-4xl font-bold tracking-tight text-white text-center mb-10 sm:mb-14"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          >
            Two reports. Claim-ready outputs.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <h3 className="text-xl font-bold text-black mb-3">Executive Summary</h3>
              <p className="text-neutral-700 text-base leading-relaxed">
                A clean branded PDF with headline results, outcome table, trend chart, and example marketing claim language — ready for your compliance review.
              </p>
            </Card>
            <Card
              className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <h3 className="text-xl font-bold text-black mb-3">Full Dataset Report</h3>
              <p className="text-neutral-700 text-base leading-relaxed">
                Complete statistical appendix, anonymised participant data, wearable biometric trends, individual change trajectories, confound analysis, and attrition breakdown.
              </p>
            </Card>
            <Card
              className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <h3 className="text-xl font-bold text-black mb-3">Marketing Claim Examples</h3>
              <p className="text-neutral-700 text-base leading-relaxed">
                Three tiers of example claim language — long-form, landing page, and ad creative — derived directly from study results. For brand compliance review before any external use.
              </p>
            </Card>
          </div>
          <p className="mt-10 text-center text-sm text-neutral-200" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            A sample executive summary is available to download at the top of this page.
          </p>
        </div>
      </section>

      {/* Section 5a — Marketing Assets */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6"
        style={{
          backgroundImage: "url('/how.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto max-w-6xl">
          <h2
            className="text-2xl sm:text-4xl font-bold tracking-tight text-white text-center mb-4 sm:mb-6"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          >
            Turn your study into marketing proof
          </h2>
          <p
            className="text-base sm:text-xl text-neutral-200 text-center max-w-3xl mx-auto mb-10 sm:mb-14 leading-relaxed px-2"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
          >
            A BioStackr study produces claim-ready assets your team can use across ads, landing pages and retail listings.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <h3 className="text-xl font-bold text-black mb-3">Ads & creative</h3>
              <p className="text-neutral-700 text-base leading-relaxed">
                Use verified outcome claims in paid social, display, and video — with example language ready for compliance review.
              </p>
            </Card>
            <Card
              className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <h3 className="text-xl font-bold text-black mb-3">Landing pages</h3>
              <p className="text-neutral-700 text-base leading-relaxed">
                Build trust with real study results, trend charts, and outcome tables — instead of generic testimonials.
              </p>
            </Card>
            <Card
              className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-6 shadow-lg"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <h3 className="text-xl font-bold text-black mb-3">Retail listings</h3>
              <p className="text-neutral-700 text-base leading-relaxed">
                Give buyers and distributors the evidence they need — claim-ready language that stands up to scrutiny.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 5b — Positioning before pricing */}
      <section className="relative py-14 sm:py-20 px-4 sm:px-6 bg-white border-t border-neutral-200">
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-4">
            The middle ground between testimonials and clinical trials
          </h2>
          <p className="text-neutral-700 text-base sm:text-lg leading-relaxed">
            Clinical trials take years and cost hundreds of thousands.
            Testimonials aren&apos;t trusted anymore.
            BioStackr gives you real-world evidence in 21–30 days.
          </p>
        </div>
      </section>

      {/* Section 6 — Pricing */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6"
        style={{
          backgroundImage: "url('/last.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-center mb-4">
            Beta pricing for early brand partners
          </h2>
          <p className="text-neutral-200 text-center mb-8 max-w-2xl mx-auto">
            BioStackr is onboarding a limited number of supplement brands at reduced beta pricing before moving to standard commercial rates.
          </p>
          <div className="rounded-2xl bg-[#faf9f7] p-6 sm:p-8 shadow-xl overflow-x-auto" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <p className="text-center font-bold text-neutral-900 text-base sm:text-lg mb-6">Everything included. No hidden costs.</p>
            <table className="w-full min-w-[360px] text-sm sm:text-base">
              <thead>
                <tr className="border-b border-neutral-300">
                  <th className="text-left py-3 sm:py-4 text-xs sm:text-sm font-medium text-neutral-500">Study</th>
                  <th className="text-left py-3 sm:py-4 text-xs sm:text-sm font-medium text-neutral-500">Participants</th>
                  <th className="text-left py-3 sm:py-4 text-xs sm:text-sm font-medium text-neutral-500">Duration</th>
                  <th className="text-right py-3 sm:py-4 text-xs sm:text-sm font-medium text-neutral-500">Beta</th>
                  <th className="text-right py-3 sm:py-4 text-xs sm:text-sm font-medium text-neutral-400 hidden sm:table-cell">Standard</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-200">
                  <td className="py-4 sm:py-5 text-neutral-900 text-sm sm:text-base">Signal</td>
                  <td className="py-4 sm:py-5 text-neutral-900 text-sm sm:text-base">10–15 (aim: 12)</td>
                  <td className="py-4 sm:py-5 text-neutral-900 text-sm sm:text-base">21 days</td>
                  <td className="py-4 sm:py-5 text-right font-bold text-black text-lg sm:text-xl">$5,000</td>
                  <td className="py-4 sm:py-5 text-right text-xs sm:text-sm text-neutral-500 hidden sm:table-cell">$12,500</td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <td className="py-4 sm:py-5 text-neutral-900 text-sm sm:text-base">Signal+</td>
                  <td className="py-4 sm:py-5 text-neutral-900 text-sm sm:text-base">15–25 (aim: 20)</td>
                  <td className="py-4 sm:py-5 text-neutral-900 text-sm sm:text-base">21 days</td>
                  <td className="py-4 sm:py-5 text-right font-bold text-black text-lg sm:text-xl">$10,000</td>
                  <td className="py-4 sm:py-5 text-right text-xs sm:text-sm text-neutral-500 hidden sm:table-cell">$20,000</td>
                </tr>
                <tr>
                  <td className="py-4 sm:py-5 text-neutral-900 text-sm sm:text-base">Core</td>
                  <td className="py-4 sm:py-5 text-neutral-900 text-sm sm:text-base">30–50 (aim: 40)</td>
                  <td className="py-4 sm:py-5 text-neutral-900 text-sm sm:text-base">30 days</td>
                  <td className="py-4 sm:py-5 text-right font-bold text-black text-lg sm:text-xl">$18,000</td>
                  <td className="py-4 sm:py-5 text-right text-xs sm:text-sm text-neutral-500 hidden sm:table-cell">$32,000</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-8 space-y-3 text-sm text-neutral-500 leading-relaxed">
              <p>All studies include wearable data integration (Apple Health, WHOOP, Oura, Garmin, and most major wearables), compliance monitoring, full statistical analysis, executive summary, and full dataset report with marketing-ready claim language.</p>
              <p>90-day category exclusivity available on request.</p>
              <p>Beta pricing available to brands confirming within the current onboarding window.</p>
            </div>
            <p className="mt-8 pt-6 border-t border-neutral-200 text-base text-neutral-600">
              Typical clinical trial: $500,000–$2,000,000. BioStackr study from $5,000.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7 — Contact Form */}
      <section
        id="contact"
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 scroll-mt-20"
        style={{
          backgroundImage: "url('/guess.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto max-w-xl">
          <div className="text-center mb-12">
            <h2
              className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            >
              Request a cohort study overview
            </h2>
            <p
              className="mt-4 text-lg text-neutral-200"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            >
              See how your product performs in a BioStackr study. We will come back to you within one business day.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xl space-y-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">Your name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.name ? 'border-red-500' : 'border-neutral-300'}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="brandProduct" className="block text-sm font-medium text-neutral-700 mb-2">Brand name and product *</label>
              <input
                type="text"
                id="brandProduct"
                value={formData.brandProduct}
                onChange={(e) => setFormData((p) => ({ ...p, brandProduct: e.target.value }))}
                placeholder="e.g. Beam — Dream powder"
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.brandProduct ? 'border-red-500' : 'border-neutral-300'}`}
              />
              {errors.brandProduct && <p className="mt-1 text-sm text-red-600">{errors.brandProduct}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">Your email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.email ? 'border-red-500' : 'border-neutral-300'}`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-2">Message</label>
              <textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                placeholder="Tell us about your brand and what you are hoping to learn"
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              />
            </div>
            {submitSuccess && (
              <p className="text-green-700 font-medium">Thanks — we will be in touch within one business day.</p>
            )}
            {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white hover:bg-neutral-800 rounded-full py-5 sm:py-6 font-semibold text-base min-h-[48px] touch-manipulation"
            >
              {isSubmitting ? 'Sending...' : 'Send enquiry'}
            </Button>
            <p className="text-center text-sm text-neutral-500">No obligation. We will reply personally within one business day.</p>
          </form>
          <p className="mt-8 text-center text-sm text-white/80 max-w-xl mx-auto">
            BioStackr is building the largest real-world supplement outcomes dataset.
          </p>
        </div>
      </section>
    </div>
  )
}
