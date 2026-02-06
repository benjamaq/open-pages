import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { CheckinEducationModal } from '@/components/dashboard/CheckinEducationModal';
import { DailyProgressLoop } from '@/components/dashboard/DailyProgressLoop';
import { CheckinLauncher } from '@/components/dashboard/CheckinLauncher';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { PersonalHeader } from '@/components/dashboard/PersonalHeader';
import { StackEconomicsCard } from '@/components/dashboard/YourStackCostCard';
import { DashboardUnifiedPanel } from '@/components/dashboard/DashboardUnifiedPanel';
import DashboardAddSupplementGate from '@/components/dashboard/DashboardAddSupplementGate';
import UpgradeButton from '@/components/billing/UpgradeButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  // Do not block dashboard for context education; optional nudge shown on dashboard

  // Build absolute base URL from headers (await per Next 15 rules)
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3010';
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;
  // Forward cookies properly from request headers (avoids calling toString on cookies())
  const cookieHeader = hdrs.get('cookie') ?? '';

  // Fetch context with forwarded cookies (do not let this crash the page)
  let context: any = {}
  try {
    const r = await fetch(`${baseUrl}/api/elli/context`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })
    context = r.ok ? await r.json() : {}
  } catch {}
  // Fetch billing status (unified isPaid boolean) - tolerant to failures
  let billing: any = { isPaid: false, subscription: null }
  try {
    const r = await fetch(`${baseUrl}/api/billing/info`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })
    billing = r.ok ? await r.json() : { isPaid: false, subscription: null }
  } catch {}

  // Determine overall progress toward first insights (use activeTests/activeTrials daysCompleted or 0)
  // Use number of check-ins for progress (so Day 1 after first check-in)
  const overallDaysCompleted = Math.min(7, Number((context as any)?.totalCheckins || 0))

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/white.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 sm:py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto">
          {/* Row 1: Brand on left, CTA on right */}
          <div className="flex items-center justify-between">
            <a href="/dashboard" className="flex items-center">
              <img src="/BIOSTACKR LOGO 2.png" alt="Biostackr" className="h-7 sm:h-8 w-auto" />
            </a>
            <a
              href="/upload"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
              title="Upload Wearable Data"
            >
              <span aria-hidden="true">⌚</span>
              <span>Upload&nbsp;Wearable&nbsp;Data</span>
            </a>
          </div>
          {/* Row 2: Text nav (no buttons) */}
          <nav className="mt-2 flex items-center gap-4 sm:gap-6 text-sm text-slate-700 justify-start sm:justify-end">
            <a href="/dashboard" className="hover:underline">Dashboard</a>
            <a href="/results" className="hover:underline">My Stack</a>
            <a href="/settings" className="hover:underline">Settings</a>
            <UpgradeButton compact />
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Opens Add Supplement when ?add=1 is present */}
          <DashboardAddSupplementGate />
          <>
            <div className="mb-2">
              <PersonalHeader />
            </div>
            {/* Unified control/status panel */}
            <DashboardUnifiedPanel />
            <DailyProgressLoop />
          </>
          <CheckinLauncher />
          <CheckinEducationModal />
        </div>
      </main>
    </div>
  );
}
