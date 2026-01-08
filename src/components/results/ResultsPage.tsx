"use client";

import React, { useEffect, useMemo, useState } from "react";
import ExecutiveSummaryCard from "./ExecutiveSummaryCard";
import CostOfClarityCard from "./CostOfClarityCard";
import StackIntelligenceCard from "./StackIntelligenceCard";
import HypothesisPreviewCard from "./HypothesisPreviewCard";
import DiscoveriesSection from "./DiscoveriesSection";
import HallOfExesCard from "./HallOfExesCard";
import JourneyNudgeCard from "./JourneyNudgeCard";

type Sections = {
  clearSignal?: any[];
  noSignal?: any[];
  building?: any[];
  needsData?: any[];
};

export default function ResultsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/progress/loop", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });
    // Fetch membership for gating
    (async () => {
      try {
        const r = await fetch('/api/payments/status', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) {
          const j = await r.json()
          setIsMember(Boolean((j as any)?.is_member))
        }
      } catch {}
    })()
    return () => {
      mounted = false;
    };
  }, []);

  const sections: Sections = data?.sections || {};
  const workingSupps = sections.clearSignal || [];
  const wastedSupps = sections.noSignal || [];
  const testingSupps = [...(sections.building || []), ...(sections.needsData || [])];
  const allSupps = [...workingSupps, ...wastedSupps, ...testingSupps];

  const totals = useMemo(() => {
    const sumYear = (arr: any[]) => arr.reduce((sum, s) => sum + ((s?.monthlyCost || 0) * 12), 0);
    const workingYearly = sumYear(workingSupps);
    const wastedYearly = sumYear(wastedSupps);
    const testingYearly = sumYear(testingSupps);
    const totalYearly = workingYearly + wastedYearly + testingYearly;
    return { workingYearly, wastedYearly, testingYearly, totalYearly };
  }, [workingSupps, wastedSupps, testingSupps]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/dashboard" className="text-sm text-slate-700 hover:underline">← Back to Dashboard</a>
            <div className="text-sm font-semibold text-slate-900">Results</div>
            <div />
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">Loading…</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/dashboard" className="text-sm text-slate-700 hover:underline">← Back to Dashboard</a>
            <div className="text-sm font-semibold text-slate-900">Results</div>
            <div />
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">Error loading results</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/dashboard" className="text-sm text-slate-700 hover:underline">← Back to Dashboard</a>
          <div className="text-sm font-semibold text-slate-900">Results</div>
          <div />
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">Results</h1>
          <p className="mt-1 text-sm text-neutral-600">Deeper insights you can’t get from the dashboard.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ExecutiveSummaryCard working={workingSupps} wasted={wastedSupps} testing={testingSupps} isMember={isMember} />
          <CostOfClarityCard totalYearly={totals.totalYearly} wastedYearly={totals.wastedYearly} />
        </div>

        <div className="mt-6 space-y-6">
          <StackIntelligenceCard
            allSupps={allSupps}
            workingSupps={workingSupps}
            wastedSupps={wastedSupps}
            testingSupps={testingSupps}
          />
          {(workingSupps.length === 0 && wastedSupps.length === 0) && <HypothesisPreviewCard />}
          <DiscoveriesSection workingSupps={workingSupps} />
          <HallOfExesCard wastedSupps={wastedSupps} />
          <JourneyNudgeCard />
        </div>
      </div>
    </div>
  );
}


