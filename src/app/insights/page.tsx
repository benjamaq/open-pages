'use client';

import { HeroStatsBar } from '@/components/insights/HeroStatsBar';
import { TruthReportPreview } from '@/components/insights/TruthReportPreview';
import { CorrelationCards } from '@/components/insights/CorrelationCards';
import { TrendsSection } from '@/components/insights/TrendsSection';
import { SpendByGoalDonut } from '@/components/insights/SpendByGoalDonut';
import { ROIRankingSection } from '@/components/insights/ROIRankingSection';
import { ConsistencyCalendar } from '@/components/insights/ConsistencyCalendar';
import { EffectsResultsSection } from '@/components/insights/EffectsResultsSection';

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/dashboard" className="flex items-center">
            <img src="/BIOSTACKR LOGO 2.png" alt="BioStackr" className="h-8 w-auto" />
          </a>
          <nav className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-slate-600">Dashboard</a>
            <a href="/results" className="text-sm font-medium">Results</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-10">
          <HeroStatsBar />
          <TruthReportPreview />
          <EffectsResultsSection />
          <CorrelationCards />
          <TrendsSection />
          <SpendByGoalDonut />
          <ROIRankingSection />
          <ConsistencyCalendar />
        </div>
      </main>
    </div>
  );
}


