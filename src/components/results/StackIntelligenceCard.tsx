"use client";

import React from "react";

const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]";

type Supp = {
  id: string;
  name: string;
  monthlyCost?: number | null;
  primaryGoalTags?: string[];
  primary_goal_tags?: string[];
};

type Props = {
  allSupps: Supp[];
  workingSupps: Supp[];
  wastedSupps: Supp[];
  testingSupps: Supp[];
};

export default function StackIntelligenceCard({
  allSupps,
  workingSupps,
  wastedSupps,
  testingSupps,
}: Props) {
  const categorizeSupp = (supp: Supp): string[] => {
    const goals = (supp?.primaryGoalTags || supp?.primary_goal_tags || []).map((g) =>
      String(g || "").toLowerCase()
    );
    if (goals.length > 0) return goals;
    const name = String(supp?.name || "").toLowerCase();
    const cats: string[] = [];
    if (name.includes("magnesium") || name.includes("melatonin") || name.includes("gaba") || name.includes("glycine"))
      cats.push("sleep");
    if (name.includes("b-complex") || name.includes("b12") || name.includes("d3") || name.includes("vitamin d") || name.includes("creatine"))
      cats.push("energy");
    if (name.includes("omega") || name.includes("fish oil") || name.includes("ashwagandha") || name.includes("rhodiola"))
      cats.push("mood");
    if (name.includes("protein") || name.includes("collagen") || name.includes("turmeric") || name.includes("curcumin"))
      cats.push("recovery");
    return cats.length > 0 ? cats : ["other"];
  };

  const counts: Record<string, number> = {};
  allSupps.forEach((s) => {
    const cats = categorizeSupp(s);
    cats.forEach((c) => {
      counts[c] = (counts[c] || 0) + 1;
    });
  });

  const coreCats = ["sleep", "energy", "mood", "recovery"];
  const gaps = coreCats.filter((c) => (counts[c] || 0) === 0);
  const overlaps = coreCats.filter((c) => (counts[c] || 0) >= 2);

  const highProb = workingSupps.length;
  const uncertain = testingSupps.length;
  const wildcards = wastedSupps.length; // placeholder interpretation

  return (
    <section className={`${cardBase} p-5 md:p-6`}>
      <div className="text-xs uppercase tracking-wide text-neutral-500">Stack intelligence</div>
      <h2 className="mt-1 text-base md:text-lg font-semibold text-neutral-900">Patterns in your stack</h2>
      <p className="mt-1 text-sm text-neutral-600">Not what you’re taking — what your stack is doing.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Coverage gaps */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Coverage gaps</div>
          <ul className="mt-2 space-y-2 text-sm text-neutral-700">
            {gaps.length === 0 ? (
              <li>
                <span className="font-semibold text-neutral-900">No obvious gaps:</span> core areas have coverage.
              </li>
            ) : (
              gaps.map((g) => (
                <li key={g}>
                  <span className="font-semibold text-neutral-900">{g.charAt(0).toUpperCase() + g.slice(1)}:</span> no primary support
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Overlaps */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Overlaps</div>
          <p className="mt-2 text-sm text-neutral-700">
            {overlaps.length > 0 ? (
              <>
                Multiple items target <span className="font-semibold text-neutral-900">{overlaps.join(", ")}</span>. Once verdicts land, you may only
                need one per category.
              </>
            ) : (
              <>No clear overlaps yet.</>
            )}
          </p>
          {/* Removed probabilistic badge per brief */}
        </div>

        {/* Probability tiers */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Probability</div>
          <div className="mt-2 space-y-2 text-sm text-neutral-700">
            <div className="flex items-center justify-between">
              <span>High‑probability</span>
              <span className="font-semibold text-neutral-900">{highProb}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Uncertain</span>
              <span className="font-semibold text-neutral-900">{uncertain}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Wildcards</span>
              <span className="font-semibold text-neutral-900">{wildcards}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

