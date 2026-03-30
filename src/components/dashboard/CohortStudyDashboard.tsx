'use client'

import { useEffect, useState } from 'react'

export interface CohortStudyDashboardProps {
  cohortId: string
  /** True when cohort_participants.confirmed_at is set — 21-day study is active. */
  cohortConfirmed: boolean
  /** ISO timestamp: enrollment + 48h; for compliance-gate countdown only. */
  complianceDeadlineIso: string | null
  brandName: string
  productName: string
  checkinCount: number
  studyDays: number
  startDateIso: string | null
  hasCheckedInToday: boolean
  currentStreak: number
  currentDay: number
  daysRemaining: number
  studyComplete: boolean
  studyEndDate: string | null
  onOpenCheckin: () => void
}

function formatStudyEndDate(isoOrYmd: string | null): string {
  if (!isoOrYmd) return 'the study end date'
  const s = isoOrYmd.slice(0, 10)
  const t = Date.parse(`${s}T12:00:00Z`)
  if (!Number.isFinite(t)) return isoOrYmd
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatGateTimeRemaining(deadlineMs: number, nowMs: number): { line: string; sub: string } {
  const left = deadlineMs - nowMs
  if (left <= 0) {
    return { line: '—', sub: 'Complete check-in 2 to confirm' }
  }
  const h = Math.floor(left / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  if (h >= 48) {
    return { line: `${h}h`, sub: '48-hour confirmation window' }
  }
  if (h >= 1) {
    return { line: `${h}h ${m}m`, sub: '48-hour confirmation window' }
  }
  if (m >= 1) {
    return { line: `${m}m`, sub: '48-hour confirmation window' }
  }
  return { line: 'Under a minute', sub: '48-hour confirmation window' }
}

function SpotConfirmedCountdown({
  deadlineIso,
}: {
  deadlineIso: string | null
}) {
  const [display, setDisplay] = useState<{ line: string; sub: string }>({
    line: '—',
    sub: '48-hour confirmation window',
  })
  useEffect(() => {
    const tick = () => {
      if (!deadlineIso) {
        setDisplay({ line: '—', sub: 'Complete check-in 2 to confirm' })
        return
      }
      const ms = Date.parse(deadlineIso)
      if (!Number.isFinite(ms)) {
        setDisplay({ line: '—', sub: 'Complete check-in 2 to confirm' })
        return
      }
      setDisplay(formatGateTimeRemaining(ms, Date.now()))
    }
    tick()
    const id = window.setInterval(tick, 30000)
    return () => window.clearInterval(id)
  }, [deadlineIso])

  return (
    <div className="text-center flex-1 min-w-[100px]">
      <div className="text-2xl font-semibold text-gray-900 tabular-nums">{display.line}</div>
      <div className="text-xs font-medium text-gray-700 mt-1">Spot confirmed in</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{display.sub}</div>
    </div>
  )
}

export default function CohortStudyDashboard({
  cohortId: _cohortId,
  cohortConfirmed,
  complianceDeadlineIso,
  brandName,
  productName,
  checkinCount,
  studyDays,
  startDateIso: _startDateIso,
  hasCheckedInToday,
  currentStreak,
  currentDay,
  daysRemaining,
  studyComplete,
  studyEndDate,
  onOpenCheckin,
}: CohortStudyDashboardProps) {
  void _cohortId
  void _startDateIso
  const progressPct = studyComplete ? 100 : Math.min(100, (currentDay / studyDays) * 100)

  const gateComplete = Math.min(2, Math.max(0, checkinCount))
  const gateProgressPct = (gateComplete / 2) * 100

  const statCell = (value: number | string, label: string, sub: string) => (
    <div className="text-center flex-1 min-w-[100px]">
      <div className="text-2xl font-semibold text-gray-900 tabular-nums">{value}</div>
      <div className="text-xs font-medium text-gray-700 mt-1">{label}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <section>
        <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
          <span className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide">
            {brandName ? `${brandName} · ${productName}` : productName}
          </span>
          {productName} study
        </h1>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        {!cohortConfirmed ? (
          <div>
            <div className="text-3xl font-bold text-gray-900">Securing your spot</div>
            <p className="mt-2 text-base font-medium text-gray-800">
              Check-in {gateComplete} of 2 complete
            </p>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Complete 2 check-ins within 48 hours to confirm your place in the study. Your 21-day tracking begins once
              your spot is confirmed.
            </p>
            <div className="mt-5 flex gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={2} aria-valuenow={gateComplete}>
              <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: gateComplete >= 1 ? '100%' : '0%', backgroundColor: '#C84B2F' }}
                />
              </div>
              <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: gateComplete >= 2 ? '100%' : '0%', backgroundColor: '#C84B2F' }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Progress: {gateComplete} of 2 filled</p>
          </div>
        ) : studyComplete ? (
          <div>
            <div className="text-3xl font-bold text-gray-900">Study complete</div>
            <p className="mt-2 text-sm text-gray-600">Thank you for finishing the study. Your results will be shared when ready.</p>
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-900">
              Day {currentDay} of {studyDays}
            </div>
            <div className="mt-4 h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${progressPct}%`, backgroundColor: '#C84B2F' }}
              />
            </div>
            <p className="mt-3 text-sm text-gray-600">{daysRemaining} days remaining</p>
          </>
        )}
      </section>

      <section>
        {hasCheckedInToday ? (
          <div className="rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/60 p-5">
            <div className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
              <span className="text-emerald-700" aria-hidden="true">
                ✓
              </span>{' '}
              Checked in today
            </div>
            <p className="mt-2 text-sm text-gray-700">Great work. Come back tomorrow morning after you wake up.</p>
            <button
              type="button"
              className="mt-4 text-sm text-gray-600 underline underline-offset-2 hover:text-gray-900"
              onClick={onOpenCheckin}
            >
              Edit today&apos;s check-in
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-amber-200/90 bg-amber-50/50 p-5">
            <div className="text-sm font-semibold text-amber-950">Today&apos;s check-in</div>
            <p className="mt-2 text-sm text-gray-700">Complete your daily check-in to keep your streak going.</p>
            <p className="mt-1 text-sm text-gray-600">It takes about 30 seconds.</p>
            <button
              type="button"
              onClick={onOpenCheckin}
              className="mt-4 w-full rounded-xl bg-gray-900 text-white py-3 font-semibold hover:bg-gray-800"
            >
              Check in now
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap justify-center gap-6 sm:gap-8">
        {statCell(checkinCount, 'Check-ins done', 'this study')}
        {statCell(currentStreak, 'Current streak', 'day streak')}
        {cohortConfirmed ? statCell(daysRemaining, 'Days remaining', 'days left') : (
          <SpotConfirmedCountdown deadlineIso={complianceDeadlineIso} />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">What we&apos;re measuring</h2>
        <ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal list-inside">
          <li>Sleep quality</li>
          <li>Morning energy</li>
          <li>Time to fall asleep</li>
          <li>Times woken in the night</li>
        </ol>
        <p className="mt-4 text-sm text-gray-600">
          Your data matures over {studyDays} days. Results are delivered at the end of the study.
        </p>
      </section>

      <footer className="text-xs text-gray-500 leading-relaxed pb-8">
        <p>This study is run by BioStackr on behalf of {brandName || 'the study partner'}.</p>
        <p className="mt-2">
          Questions? Contact{' '}
          <a href="mailto:ben@biostackr.io" className="text-gray-700 underline underline-offset-2">
            ben@biostackr.io
          </a>
        </p>
        <p className="mt-2">
          Stack locked during study · unlocks automatically on {formatStudyEndDate(studyEndDate)}
        </p>
      </footer>
    </div>
  )
}
