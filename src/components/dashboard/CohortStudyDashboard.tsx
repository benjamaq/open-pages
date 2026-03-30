'use client'

export interface CohortStudyDashboardProps {
  cohortId: string
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

export default function CohortStudyDashboard({
  cohortId: _cohortId,
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
        {studyComplete ? (
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
        {statCell(daysRemaining, 'Days remaining', 'days left')}
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
