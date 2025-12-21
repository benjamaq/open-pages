'use client';

import { useState, useEffect } from 'react';
import { StatusUpdate } from '@/components/dashboard/StatusUpdate';
import { SupplementsInTesting } from '@/components/dashboard/SupplementsInTesting';
import { TodaysCheckin } from '@/components/dashboard/TodaysCheckin';

export default function DashboardClient({ supplements }: { supplements: any[] }) {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContext() {
      try {
        const res = await fetch('/api/elli/context');
        const data = await res.json();
        setContext(data);
      } catch (error) {
        console.error('Failed to load context:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadContext();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Failed to load dashboard</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">BioStackr</h1>
          <nav className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-medium">Dashboard</a>
            <a href="/insights" className="text-sm text-slate-600">Insights</a>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Complete Check-in
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-12">
          <StatusUpdate 
            daysTracked={context.daysTracked}
            totalCheckins={context.totalCheckins}
            currentStreak={context.currentStreak}
            hasNewTruthReport={context.hasNewTruthReport}
            microInsights={context.microInsights || []}
            activeTestsLength={context.activeTests?.length || 0}
          />
          
          <SupplementsInTesting 
            activeTests={context.activeTests || []}
            microInsights={context.microInsights || []}
            supplements={supplements}
          />
          
          <TodaysCheckin 
            hasCheckinToday={context.hasCheckinToday}
            today={context.today}
            yesterday={context.yesterday}
            onOpenCheckin={() => console.log('Open checkin modal')}
          />
        </div>
      </main>
    </div>
  );
}




