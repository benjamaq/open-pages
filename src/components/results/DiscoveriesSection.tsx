"use client";

import React from "react";

const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]";

type Supp = {
  id: string;
  name: string;
  effectPct?: number | null;
  primaryGoalTags?: string[];
  primary_goal_tags?: string[];
};

export default function DiscoveriesSection({ workingSupps }: { workingSupps: Supp[] }) {
  if (!Array.isArray(workingSupps) || workingSupps.length === 0) return null;

  const toTitle = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const firstN = workingSupps.slice(0, 3);

  const inferDomain = (supp: Supp): string => {
    const goals = (supp.primaryGoalTags || supp.primary_goal_tags || []).map((g) => String(g).toLowerCase());
    if (goals.length) return toTitle(goals[0]);
    const nm = String(supp.name || "").toLowerCase();
    if (nm.includes("magnesium") || nm.includes("melatonin") || nm.includes("sleep")) return "Sleep";
    if (nm.includes("creatine") || nm.includes("vitamin d") || nm.includes("energy")) return "Energy";
    if (nm.includes("omega") || nm.includes("ashwagandha") || nm.includes("mood")) return "Mood";
    return "Outcome";
  };

  return (
    <section className={`${cardBase} p-5 md:p-6`}>
      <div className="text-xs uppercase tracking-wide text-neutral-500">Discoveries</div>
      <h2 className="mt-1 text-base md:text-lg font-semibold text-neutral-900">Non‑obvious effects we’ve detected</h2>
      <p className="mt-1 text-sm text-neutral-600">
        These insights only appear once signal crosses a confidence threshold.
      </p>
      <div className="mt-4 space-y-3">
        {firstN.map((s) => {
          const domain = inferDomain(s);
          const effect = typeof s.effectPct === "number" ? `${Math.round(s.effectPct)}% positive change` : "Positive shift detected";
          return (
            <div key={s.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{domain}</div>
                  <p className="mt-1 text-sm text-neutral-700">
                    {s.name?.split(",")[0] || "One supplement"} shows{" "}
                    <span className="font-semibold text-neutral-900">{effect}</span>.
                  </p>
                  <p className="mt-2 text-sm text-neutral-600">Interpretation: keep going — we’re seeing real movement.</p>
                </div>
                <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">
                  data‑based
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

