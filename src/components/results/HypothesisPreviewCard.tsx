"use client";

import React from "react";

const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]";

export default function HypothesisPreviewCard() {
  return (
    <section className={`${cardBase} p-5 md:p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Hypothesis preview</div>
          <h2 className="mt-1 text-base md:text-lg font-semibold text-neutral-900">What we expect to learn next</h2>
        </div>
        <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">
          model‑based
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-neutral-200 bg-[#fbfaf8] p-4">
        <p className="text-sm text-neutral-800">
          Effects typically appear in this order:
          <span className="font-semibold text-neutral-900"> Sleep → Energy → Mood</span>.
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          If nothing shifts in sleep by ~14 clean days, your current stack may be low‑signal.
        </p>
      </div>
    </section>
  );
}

