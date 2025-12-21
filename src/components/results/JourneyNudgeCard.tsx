"use client";

import React from "react";

const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]";

export default function JourneyNudgeCard() {
  return (
    <section className={`${cardBase} p-5 md:p-6`}>
      <div className="text-xs uppercase tracking-wide text-neutral-500">Your journey</div>
      <p className="mt-1 text-sm text-neutral-800">
        You’re ahead of <span className="font-semibold text-neutral-900">45%</span> of users who stop before Day 7.
      </p>
    </section>
  );
}

