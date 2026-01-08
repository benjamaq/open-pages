"use client";

import React from "react";
import InsightBullet from "./InsightBullet";

const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]";

type Props = {
  working: any[];
  wasted: any[];
  testing: any[];
  isMember?: boolean;
};

export default function ExecutiveSummaryCard({ working, wasted, testing, isMember = false }: Props) {
  const hasInsights = (working?.length ?? 0) + (wasted?.length ?? 0) > 0;

  const bullets = hasInsights && isMember
    ? [
        `You’ve locked in ${working.length} keeper${working.length === 1 ? "" : "s"}.`,
        wasted.length > 0
          ? `${wasted.length} item${wasted.length === 1 ? "" : "s"} look${wasted.length === 1 ? "s" : ""} like “expensive placebos.”`
          : "Your current stack shows no clear waste yet.",
        testing.length > 0
          ? `${testing.length} still building signal — expect clearer results after more clean days.`
          : "Most items have enough data for a verdict.",
      ]
    : [
        "Stacks like yours often show first changes in Sleep, then Energy, then Mood.",
        "The first strong signal typically emerges after ~7–14 clean days.",
        "[Locked] Upgrade to see your personalized findings here.",
      ];

  const knowledge = hasInsights
    ? (isMember
        ? `Early answers are coming into focus — ${working.length} working, ${wasted.length} to reconsider, ${testing.length} still in flight.`
        : "We’re still building signal. Full insights unlock with membership.")
    : "We’re still building signal. Expect early insight within the next 1–2 weeks of consistent check‑ins.";

  return (
    <section className={`${cardBase} p-5 md:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Executive summary</div>
          <h2 className="mt-1 text-base md:text-lg font-semibold text-neutral-900">What you know now</h2>
          <p className="mt-1 text-sm text-neutral-600">The non‑obvious takeaways so far.</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-[#fbfaf8] p-4">
        <div className="text-xs uppercase tracking-wide text-neutral-500">Knowledge state</div>
        <p className="mt-1 text-sm text-neutral-800">{knowledge}</p>
      </div>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-neutral-500">What you’ve learned</div>
        <ul className="mt-2 space-y-2">
          {bullets.map((b: string, idx: number) => (
            <InsightBullet key={idx} text={b} tone="neutral" />
          ))}
        </ul>
      </div>
    </section>
  );
}


