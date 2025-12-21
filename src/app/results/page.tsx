"use client";

import React from "react";
import dynamic from "next/dynamic";

const ResultsPage = dynamic(() => import("@/components/results/ResultsPage"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">Loading…</div>
    </div>
  ),
});

export default function Page() {
  return <ResultsPage />;
}


