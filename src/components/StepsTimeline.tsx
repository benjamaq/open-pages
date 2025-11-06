import React from "react";

function Connector() {
  return (
    <div aria-hidden className="hidden h-0.5 w-10 shrink-0 rounded bg-slate-200 sm:block" />
  );
}

export function StepsTimeline() {
  const steps = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      ),
      title: "Log — 20 seconds",
      text: "Rate sleep + what you did (coffee, stress, screens). No forms. No overthinking.",
      helper: "Day 1",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
      title: "Elli finds your pattern",
      text: "In ~5–7 days, clear connections appear: “Afternoon coffee → 2hr delay to sleep.”",
      helper: "Days 3–5",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: "One change. One win.",
      text: "Try the fix for 5 days. If it works, lock it in. One pattern. One week. Better sleep.",
      helper: "Days 7–14",
    },
  ];

  return (
    <section id="how-it-works" aria-labelledby="steps" className="py-12 md:py-16 bg-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h2 id="steps" className="text-3xl font-bold text-slate-900">Three steps. One week. Clear answers.</h2>
          <p className="mt-2 text-slate-600">Simple, linear, doable at 3 a.m.</p>
        </header>

        {/* Horizontal on sm+, stacked on mobile */}
        <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-center">
          {steps.map((s, idx) => (
            <React.Fragment key={s.title}>
              <div className="flex w-full max-w-sm flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition">
                <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-slate-50 p-3 text-slate-800">
                  {s.icon}
                </div>
                <p className="text-xs font-semibold text-amber-600">{s.helper}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-slate-600">{s.text}</p>
              </div>
              {idx < steps.length - 1 && <Connector />}
            </React.Fragment>
          ))}
        </div>

        {/* micro timeline */}
        <div className="mx-auto mt-6 flex max-w-md items-center justify-between text-xs text-slate-500">
          <span>Day 1</span>
          <div className="h-0.5 w-1/3 rounded bg-slate-200" aria-hidden />
          <span>Days 3–5</span>
          <div className="h-0.5 w-1/3 rounded bg-slate-200" aria-hidden />
          <span>Days 7–14</span>
        </div>

        <div className="mt-8 text-center">
          <a href="#get-started" className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-900 shadow-sm hover:bg-amber-300">
            Start Free
          </a>
          
        </div>
      </div>
    </section>
  );
}


