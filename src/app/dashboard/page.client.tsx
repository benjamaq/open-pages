'use client'

import UpgradeButton from '@/components/billing/UpgradeButton'
import DashboardAddSupplementGate from '@/components/dashboard/DashboardAddSupplementGate'
import { CheckinEducationModal } from '@/components/dashboard/CheckinEducationModal'
import { CheckinLauncher } from '@/components/dashboard/CheckinLauncher'
import CohortStudyDashboard from '@/components/dashboard/CohortStudyDashboard'
import { DailyProgressLoop } from '@/components/dashboard/DailyProgressLoop'
import { DashboardUnifiedPanel } from '@/components/dashboard/DashboardUnifiedPanel'
import { PersonalHeader } from '@/components/dashboard/PersonalHeader'
import { useDashboardLoad } from '@/hooks/useDashboardLoad'
import { useMemo, useState } from 'react'

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
      <div className="h-32 bg-gray-200 rounded" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  )
}

export function DashboardPageClient() {
  const { data, loading, error } = useDashboardLoad()

  const isMember = Boolean((data as any)?.billingInfo?.isPaid) || Boolean((data as any)?.paymentsStatus?.is_member)
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false)

  const shouldShowWelcomeBack = useMemo(() => {
    const daysSince = (data as any)?.elliContext?.daysSinceLastCheckin
    const hasToday = Boolean((data as any)?.elliContext?.hasCheckinToday)
    const dismissedAt = (data as any)?.settings?.welcome_back_banner_dismissed_at
    const dismissedRecently = (() => {
      if (!dismissedAt) return false
      const ms = Date.parse(String(dismissedAt))
      if (!Number.isFinite(ms)) return false
      return Date.now() - ms < 7 * 24 * 60 * 60 * 1000
    })()
    const dismissed = bannerDismissed || dismissedRecently
    return !dismissed && !hasToday && typeof daysSince === 'number' && daysSince >= 2
  }, [data, bannerDismissed])

  if (loading) return <DashboardSkeleton />
  if (error || !data) return <div className="p-6 text-sm text-gray-600">Failed to load dashboard.</div>

  const me = (data as any)?.me as Record<string, unknown> | undefined
  const showCohortStudy = Boolean(me?.cohortId && me?.cohortStudyIsActive)

  const spotBanner = (data as any)?.cohortSpotBanner as
    | { hoursRemaining: number; checkinsCompleted: number; enrolledAt: string }
    | null
    | undefined

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
          <div className="flex items-center justify-between">
            <a href="/dashboard" className="flex items-center">
              <img src="/BIOSTACKR LOGO 2.png" alt="Biostackr" className="h-7 sm:h-8 w-auto" />
            </a>
            {!showCohortStudy ? (
              <a
                href="/upload"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
                title="Upload Wearable Data"
              >
                <span aria-hidden="true">⌚</span>
                <span>Upload&nbsp;Wearable&nbsp;Data</span>
              </a>
            ) : null}
          </div>
          <nav className="mt-2 flex items-center gap-4 sm:gap-6 text-sm text-slate-700 justify-start sm:justify-end">
            <a href="/dashboard" className="hover:underline">Dashboard</a>
            {!showCohortStudy ? (
              <>
                <a href="/results" className="hover:underline">My Stack</a>
                <a href="/settings" className="hover:underline">Settings</a>
              </>
            ) : null}
            <a href="/auth/signout" className="hover:underline">Log out</a>
            {!showCohortStudy ? <UpgradeButton compact isPro={isMember} /> : null}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {showCohortStudy ? (
            <>
              <CohortStudyDashboard
                cohortId={String(me?.cohortId || '')}
                welcomeFirstName={
                  typeof me?.profileWelcomeFirstName === 'string' && me.profileWelcomeFirstName.trim()
                    ? me.profileWelcomeFirstName.trim()
                    : null
                }
                cohortConfirmed={Boolean(me?.cohortConfirmed)}
                cohortAwaitingStudyStart={Boolean(me?.cohortAwaitingStudyStart)}
                cohortStudyStartedAtIso={
                  typeof me?.cohortStudyStartedAtIso === 'string' ? me.cohortStudyStartedAtIso : null
                }
                onAfterStudyStarted={({ openCheckin } = {}) => {
                  try {
                    if (openCheckin) {
                      window.setTimeout(() => {
                        try {
                          window.dispatchEvent(new Event('open:checkin:new'))
                        } catch {}
                      }, 450)
                    }
                  } catch {}
                }}
                complianceDeadlineIso={
                  typeof me?.cohortComplianceDeadlineIso === 'string' ? me.cohortComplianceDeadlineIso : null
                }
                brandName={typeof me?.cohortStudyBrandName === 'string' ? me.cohortStudyBrandName : ''}
                productName={
                  typeof me?.cohortStudyProductName === 'string' ? me.cohortStudyProductName : 'Study'
                }
                checkinCount={typeof me?.cohortCheckinCount === 'number' ? me.cohortCheckinCount : 0}
                studyDays={
                  typeof me?.cohortStudyDays === 'number' && me.cohortStudyDays > 0 ? me.cohortStudyDays : 21
                }
                startDateIso={typeof me?.cohortStartDate === 'string' ? me.cohortStartDate : null}
                hasCheckedInToday={Boolean(me?.cohortHasCheckedInToday)}
                currentStreak={typeof me?.cohortCurrentStreak === 'number' ? me.cohortCurrentStreak : 0}
                currentDay={typeof me?.cohortStudyCurrentDay === 'number' ? me.cohortStudyCurrentDay : 1}
                daysRemaining={typeof me?.cohortDaysRemaining === 'number' ? me.cohortDaysRemaining : 0}
                studyComplete={Boolean(me?.cohortStudyComplete)}
                studyEndDate={typeof me?.cohortStudyEndDate === 'string' ? me.cohortStudyEndDate : null}
                onOpenCheckin={() => {
                  try {
                    window.dispatchEvent(new Event('open:checkin:new'))
                  } catch {}
                }}
              />
              <CheckinLauncher
                mePayload={(data as any)?.me}
                supplementsPayload={(data as any)?.supplements}
                progressPayload={(data as any)?.progressLoop}
              />
            </>
          ) : null}

          {!showCohortStudy && shouldShowWelcomeBack && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start justify-between gap-3">
              <div className="leading-snug">
                <div className="font-semibold">Welcome back!</div>
                <div className="text-amber-800/90">
                  Missed days are totally fine — your data still works. Just check in when you can.
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-amber-900/70 hover:text-amber-900 hover:bg-amber-100"
                aria-label="Dismiss welcome back message"
                onClick={() => {
                  setBannerDismissed(true)
                  try {
                    fetch('/api/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ welcome_back_banner_dismissed_at: new Date().toISOString() }),
                    }).catch(() => {})
                  } catch {}
                }}
              >
                Dismiss
              </button>
            </div>
          )}
          {!showCohortStudy && spotBanner && spotBanner.checkinsCompleted < 2 && (
            <div className="rounded-xl border border-[#6A3F2B]/30 bg-[#faf6f3] px-4 py-3 text-sm text-neutral-900">
              <div className="font-semibold text-[#6A3F2B]">
                Complete your second check-in to secure your spot — due in{' '}
                {spotBanner.hoursRemaining > 1
                  ? `${spotBanner.hoursRemaining} hours`
                  : spotBanner.hoursRemaining === 1
                    ? '1 hour'
                    : 'under an hour'}
              </div>
              <p className="mt-2 text-neutral-700 leading-snug">
                Once your second check-in is done, your spot is confirmed and your product will be on its way.
              </p>
            </div>
          )}
          {!showCohortStudy ? <DashboardAddSupplementGate /> : null}

          {!showCohortStudy ? (
            <div className="mb-2">
              <PersonalHeader me={(data as any)?.me} progress={(data as any)?.progressLoop} isMember={isMember} />
            </div>
          ) : null}

          {!showCohortStudy ? (
            <DashboardUnifiedPanel
              suggestionsPayload={(data as any)?.dailySkip}
              progressPayload={(data as any)?.progressLoop}
              supplementsPayload={(data as any)?.supplements}
              effectsPayload={(data as any)?.effectSummary}
              hasDailyPayload={(data as any)?.hasDaily}
              wearableStatusPayload={(data as any)?.wearableStatus}
              settingsPayload={(data as any)?.settings}
              isMember={isMember}
            />
          ) : null}

          {!showCohortStudy ? (
            <DailyProgressLoop
              progressPayload={(data as any)?.progressLoop}
              isMember={isMember}
              hasDailyPayload={(data as any)?.hasDaily}
              mePayload={(data as any)?.me}
            />
          ) : null}

          {!showCohortStudy ? (
            <CheckinLauncher
              mePayload={(data as any)?.me}
              supplementsPayload={(data as any)?.supplements}
              progressPayload={(data as any)?.progressLoop}
            />
          ) : null}

          {!showCohortStudy ? <CheckinEducationModal wearableStatusPayload={(data as any)?.wearableStatus} /> : null}
        </div>
      </main>
    </div>
  )
}


