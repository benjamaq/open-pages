"use client";

import React from "react";

const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]";

type Props = {
  totalYearly: number;
  wastedYearly: number;
  avgVerdictWindow?: string; // e.g., "7–14 days"
};

export default function CostOfClarityCard({
  totalYearly,
  wastedYearly,
  avgVerdictWindow = "7–14 days",
}: Props) {
  return (
    <section className={`${cardBase} p-5 md:p-6`}>
      <div className="text-xs uppercase tracking-wide text-neutral-500">Cost of clarity</div>
      <h2 className="mt-1 text-base md:text-lg font-semibold text-neutral-900">The cost of uncertainty</h2>
      <p className="mt-1 text-sm text-neutral-600">You’re not “waiting” — you’re investing in clarity.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Under test</div>
          <div className="mt-1 text-xl font-semibold text-neutral-900">${Math.round(Math.max(0, totalYearly))}/yr</div>
          <div className="mt-1 text-sm text-neutral-600">across your current stack</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">First verdict</div>
          <div className="mt-1 text-xl font-semibold text-neutral-900">{avgVerdictWindow}</div>
          <div className="mt-1 text-sm text-neutral-600">typical range</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Potential savings</div>
          <div className="mt-1 text-xl font-semibold text-neutral-900">${Math.max(156, Math.round(Math.max(0, wastedYearly)))}/yr</div>
          <div className="mt-1 text-sm text-neutral-600">average user finding</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-[#fbfaf8] p-4 text-sm text-neutral-700">
        <span className="font-semibold text-neutral-900">Framing:</span> You’re paying to find what’s worth keeping — and what’s just an expensive situationship.
      </div>
    </section>
  );
}


