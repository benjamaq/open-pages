"use client";
import Link from 'next/link'

export default function TimelineStorySection() {
  return (
    <section className="relative py-16 md:py-20 bg-gradient-to-b from-[#0f2a35]/6 to-[#231c14]/6">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 text-center">When will I see a pattern?</h2>
        <p className="mt-3 text-center text-slate-600">Most people see early signals in <span className="font-medium">3–7 days</span> and a clear pattern by week 2.</p>

        <div className="mt-10">
          <div className="hidden md:block h-0.5 bg-slate-200 relative mx-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4">
              <div className="flex items-center gap-2"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-400" /><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Day 1</p></div>
              <h3 className="mt-1 font-semibold text-slate-900">Baseline set</h3>
              <p className="mt-2 text-sm text-slate-600">You log sleep + what you did; Elli starts watching combos and lags.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4">
              <div className="flex items-center gap-2"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" /><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Days 3–7</p></div>
              <h3 className="mt-1 font-semibold text-slate-900">Early signals</h3>
              <p className="mt-2 text-sm text-slate-600">“Caffeine after 2 pm → sleep score lower.” Worth testing — not proven yet.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 ring-1 ring-purple-200">
              <div className="flex items-center gap-2"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Days 7–14</p></div>
              <h3 className="mt-1 font-semibold text-slate-900">First clear pattern</h3>
              <p className="mt-2 text-sm text-slate-600">Confidence turns on. “Evening workouts → later sleep onset (~45 min).”</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4">
              <div className="flex items-center gap-2"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" /><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Weeks 4–8</p></div>
              <h3 className="mt-1 font-semibold text-slate-900">Your playbook</h3>
              <p className="mt-2 text-sm text-slate-600">You’ve tested, locked in rules, and see fewer bad nights.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3 text-sm text-slate-600">
          <p><span className="font-medium text-slate-800">Consistency:</span> 20-second check-ins most days</p>
          <p><span className="font-medium text-slate-800">Variation:</span> small changes create contrast</p>
          <p><span className="font-medium text-slate-800">Specific tags:</span> “coffee after 2 pm”, “phone in bed”</p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#patterns" className="text-sm font-medium text-slate-700 hover:text-slate-900 underline underline-offset-4">See a sample pattern →</a>
          <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-xl px-5 py-3 bg-[#7a5af8] text-white font-medium hover:brightness-110">Find My Sleep Pattern — Free</Link>
        </div>
      </div>
    </section>
  )
}
