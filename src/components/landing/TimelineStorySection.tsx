"use client";
import Link from 'next/link'

export default function TimelineStorySection() {
  return (
    <section className="timeline-section bg-gradient-to-br from-[#1e3a8a] via-[#0f766e] to-[#854d0e] py-16 md:py-20 px-4 md:px-6">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">When will I see a pattern?</h2>
        <p className="mt-3 text-white/90 font-medium">Your first pattern in 7–14 days. Your complete health formula? That takes months to build.</p>

        <div className="timeline-cards grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-10 mb-8">
          <div className="timeline-card rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-4 md:p-6 text-left shadow-md hover:shadow-lg transition-all">
            <div className="card-badge day1 inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-3 bg-slate-400 text-white uppercase tracking-wide">Days 1–3</div>
            <h3 className="text-lg font-semibold text-slate-900">Building Your Baseline</h3>
            <p className="mt-2 text-sm text-slate-700">Track your sleep and daily patterns. BioStackr learns what “normal” looks like for you. No insights yet — just gathering data.</p>
            <p className="card-example mt-3 text-[13px] italic text-purple-700 bg-purple-50 px-3 py-2 rounded-md border-l-4 border-purple-500">“Setting your baseline. Keep tracking.”</p>
          </div>

          <div className="timeline-card rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-4 md:p-6 text-left shadow-md hover:shadow-lg transition-all">
            <div className="card-badge early inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-3 bg-blue-600 text-white uppercase tracking-wide">Days 4–7</div>
            <h3 className="text-lg font-semibold text-slate-900">First Signals</h3>
            <p className="mt-2 text-sm text-slate-700">Early connections start appearing. Not proven yet, but worth watching as more data comes in.</p>
            <p className="card-example mt-3 text-[13px] italic text-purple-700 bg-purple-50 px-3 py-2 rounded-md border-l-4 border-purple-500">“Heavy dinner after 8pm might be affecting sleep onset. Tracking to confirm.”</p>
          </div>

          <div className="timeline-card rounded-2xl border border-amber-300 bg-amber-50/90 backdrop-blur p-4 md:p-6 text-left shadow-md hover:shadow-lg transition-all">
            <div className="card-badge pattern inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-3 bg-amber-400 text-[#1F2937] uppercase tracking-wide">Week 2</div>
            <h3 className="text-lg font-semibold text-slate-900">Your First Pattern</h3>
            <p className="mt-2 text-sm text-slate-700">Enough data to confirm a real connection. You’ll see exactly what’s affecting your sleep, with confidence level and suggested action.</p>
            <p className="card-example mt-3 text-[13px] italic text-purple-700 bg-purple-50 px-3 py-2 rounded-md border-l-4 border-purple-500">“Phone in bedroom → 1.5 hours later sleep onset. High confidence. Try removing it for 5 nights.”</p>
          </div>

          <div className="timeline-card rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-4 md:p-6 text-left shadow-md hover:shadow-lg transition-all">
            <div className="card-badge ongoing inline-block text-[12px] font-bold px-3 py-1 rounded-full mb-3 bg-emerald-600 text-white uppercase tracking-wide">Months 1–6</div>
            <h3 className="text-lg font-semibold text-slate-900">Your Sleep Formula</h3>
            <p className="mt-2 text-sm text-slate-700">Multiple patterns discovered and tested. You’ve built a complete understanding of what affects YOUR sleep. This is your formula — specific to your body.</p>
            <p className="card-example mt-3 text-[13px] italic text-purple-700 bg-purple-50 px-3 py-2 rounded-md border-l-4 border-purple-500">“8 patterns confirmed. 5 rules locked in. Sleep score improved 40%.”</p>
          </div>
        </div>

        <div className="pattern-emphasis bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 md:p-10 max-w-3xl mx-auto text-center mt-6 mb-6">
          <h3 className="text-2xl font-semibold text-white mb-3">You’re not finding one answer. You’re building a library.</h3>
          <p className="text-white/95 text-[16px] leading-relaxed">Most people discover 5–10 patterns in their first 6 months. Each one is a piece of your unique sleep formula. Some show up in days. Others take months. Together, they become your complete understanding of what makes you sleep well.</p>
        </div>

        <div className="timeline-tips max-w-3xl mx-auto flex flex-wrap justify-center gap-6 bg-white/10 backdrop-blur rounded-xl p-5 text-sm text-white border border-white/20">
          <p><span className="font-semibold text-white">Track consistently:</span> 4–5 days/week minimum</p>
          <p><span className="font-semibold text-white">Be specific:</span> “Phone in bedroom” beats “used phone”</p>
          <p><span className="font-semibold text-white">Try variations:</span> Small changes reveal patterns</p>
        </div>

        <div className="mt-8">
          <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-xl px-6 py-4 bg-[#F59E0B] text-[#1F2937] text-[18px] font-bold hover:brightness-110">Start Building Your Sleep Formula</Link>
        </div>
      </div>
    </section>
  )
}

