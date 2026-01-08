"use client";

import React from "react";

const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]";

type Supp = { id: string; name: string; monthlyCost?: number | null };

export default function HallOfExesCard({ wastedSupps }: { wastedSupps: Supp[] }) {
  const yearlySavings = (wastedSupps || []).reduce((sum, s) => sum + ((s.monthlyCost || 0) * 12), 0);
  const hasExes = (wastedSupps || []).length > 0;

  return (
    <section className={`${cardBase} p-5 md:p-6`}>
      <div className="text-xs uppercase tracking-wide text-neutral-500">Hall of exes</div>
      <h2 className="mt-1 text-base md:text-lg font-semibold text-neutral-900">Supplements you’ve broken up with</h2>
      <p className="mt-1 text-sm text-neutral-600">Once confidence is real, dropped items will show here.</p>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-[#fbfaf8] p-4">
        {hasExes ? (
          <p className="text-sm text-neutral-800">
            You could save <span className="font-semibold text-neutral-900">${Math.round(yearlySavings)}/year</span> by dropping what’s not working.
          </p>
        ) : (
          <p className="text-sm text-neutral-600">
            Nothing to break up with yet — we’ll show it here when confidence is real.
          </p>
        )}
      </div>
    </section>
  );
}

