"use client";
import Link from 'next/link'

export default function TimelineStorySection() {
  return (
    <section className="timeline-section bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] py-20 px-6">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">When will I see a pattern?</h2>
        <p className="mt-3 text-slate-600">Most people see their first clear pattern within 7–14 days.</p>

        <div className="timeline-cards grid grid-cols-1 md:grid-cols-4 gap-6 mt-10 mb-8">
          <div className="timeline-card rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition-all">
            <div className="card-badge day1 inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-3 bg-slate-200 text-slate-600 uppercase tracking-wide">Days 1–3</div>
            <h3 className="text-lg font-semibold text-slate-900">You’re Building Your Baseline</h3>
            <p className="mt-2 text-sm text-slate-600">Track your sleep and what you did during the day. BioStackr is learning what “normal” looks like for you.</p>
            <p className="card-example mt-3 text-[13px] italic text-purple-700 bg-purple-50 px-3 py-2 rounded-md border-l-4 border-purple-500">No insights yet — just building data.</p>
          </div>

          <div className="timeline-card rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition-all">
            <div className="card-badge early inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-3 bg-blue-100 text-blue-600 uppercase tracking-wide">Days 4–7</div>
            <h3 className="text-lg font-semibold text-slate-900">Early Observations Appear</h3>
            <p className="mt-2 text-sm text-slate-600">You’ll start seeing possible connections. These aren’t proven yet, but they’re worth watching.</p>
            <p className="card-example mt-3 text-[13px] italic text-purple-700 bg-purple-50 px-3 py-2 rounded-md border-l-4 border-purple-500">“Caffeine after 2pm might be affecting your sleep. Tracking to confirm.”</p>
          </div>

          <div className="timeline-card rounded-2xl border border-amber-300 bg-amber-50 p-6 text-left shadow-sm hover:shadow-md transition-all">
            <div className="card-badge pattern inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-3 bg-amber-100 text-amber-700 uppercase tracking-wide">Week 2</div>
            <h3 className="text-lg font-semibold text-slate-900">First Clear Pattern</h3>
            <p className="mt-2 text-sm text-slate-600">Enough data to show a real connection. You’ll see exactly what’s helping or hurting, with confidence level.</p>
            <p className="card-example mt-3 text-[13px] italic text-purple-700 bg-purple-50 px-3 py-2 rounded-md border-l-4 border-purple-500">“Phone in bedroom → 1.5 hours later sleep. High confidence.”</p>
          </div>

          <div className="timeline-card rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition-all">
            <div className="card-badge ongoing inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-3 bg-emerald-100 text-emerald-700 uppercase tracking-wide">Weeks 3+</div>
            <h3 className="text-lg font-semibold text-slate-900">Your Personal Playbook</h3>
            <p className="mt-2 text-sm text-slate-600">Multiple patterns identified. You know what works for YOUR body. Test, lock in rules, sleep better.</p>
            <p className="card-example mt-3 text-[13px] italic text-purple-700 bg-purple-50 px-3 py-2 rounded-md border-l-4 border-purple-500">“5 patterns confirmed. 3 new rules locked in.”</p>
          </div>
        </div>

        <div className="timeline-tips max-w-3xl mx-auto flex flex-wrap justify-center gap-6 bg-white/60 backdrop-blur rounded-xl p-5 text-sm text-slate-700">
          <p><span className="font-semibold text-slate-900">Consistency:</span> Track 4–5 days/week minimum</p>
          <p><span className="font-semibold text-slate-900">Be specific:</span> “Phone in bedroom” beats “used phone”</p>
          <p><span className="font-semibold text-slate-900">Variation helps:</span> Try small changes (timing, dose, screens)</p>
        </div>

        <div className="mt-8">
          <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-xl px-5 py-3 bg-[#7a5af8] text-white font-medium hover:brightness-110">Find My Sleep Pattern — Free</Link>
        </div>
      </div>
    </section>
  )
}
