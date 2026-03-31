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
    return { line: '0h', sub: 'Complete check-in 2 to confirm' }
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
  compact,
}: {
  deadlineIso: string | null
  compact?: boolean
}) {
  const [display, setDisplay] = useState<{ line: string; sub: string }>({
    line: '…',
    sub: '48-hour confirmation window',
  })
  useEffect(() => {
    const tick = () => {
      if (!deadlineIso) {
        setDisplay({ line: '…', sub: 'Complete check-in 2 to confirm' })
        return
      }
      const ms = Date.parse(deadlineIso)
      if (!Number.isFinite(ms)) {
        setDisplay({ line: '…', sub: 'Complete check-in 2 to confirm' })
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
      <div
        className={
          compact
            ? 'text-lg font-semibold text-gray-900 tabular-nums'
            : 'text-2xl font-semibold text-gray-900 tabular-nums'
        }
      >
        {display.line}
      </div>
      <div className={`font-medium text-gray-700 mt-1 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        Spot confirmed in
      </div>
      <div className={`text-gray-500 mt-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{display.sub}</div>
    </div>
  )
}

function StudySupportModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [reason, setReason] = useState<'missed_checkin' | 'next_steps' | 'study_question' | ''>('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setReason('')
      setBusy(false)
      setDone(false)
      setErr(null)
    }
  }, [open])

  if (!open) return null

  const submit = async () => {
    if (!reason) {
      setErr('Choose an option.')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/cohort/support-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(String((j as { error?: string }).error || 'Could not send.'))
        setBusy(false)
        return
      }
      setDone(true)
    } catch {
      setErr('Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/40"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Message support</h3>
          <button type="button" className="text-sm text-gray-500 hover:text-gray-800" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">Choose one option. We email the study team with your account details.</p>
        {done ? (
          <p className="mt-4 text-sm text-emerald-800 font-medium">Sent. We will reply by email when we can.</p>
        ) : (
          <>
            <div className="mt-4 space-y-2">
              {(
                [
                  ['missed_checkin', 'I missed a check-in'],
                  ['next_steps', "I'm unsure what to do next"],
                  ['study_question', 'I have a question about the study'],
                ] as const
              ).map(([val, label]) => (
                <label
                  key={val}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                    reason === val ? 'border-gray-900 bg-gray-50' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="support-reason"
                    checked={reason === val}
                    onChange={() => {
                      setReason(val)
                      setErr(null)
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="mt-4 w-full rounded-xl bg-gray-900 text-white py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send message'}
            </button>
          </>
        )}
      </div>
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
  const [supportOpen, setSupportOpen] = useState(false)
  const progressPct = studyComplete ? 100 : Math.min(100, (currentDay / studyDays) * 100)

  const gateComplete = Math.min(2, Math.max(0, checkinCount))
  /** Two qualifying check-ins done; cron may not have set confirmed_at yet. */
  const complianceGateSatisfied = gateComplete >= 2
  const studyNameLabel = brandName ? `${brandName} · ${productName}` : productName

  const statCell = (value: number | string, label: string, sub: string) => (
    <div className="text-center flex-1 min-w-[100px]">
      <div className="text-2xl font-semibold text-gray-900 tabular-nums">{value}</div>
      <div className="text-xs font-medium text-gray-700 mt-1">{label}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>
    </div>
  )

  const statCellCompact = (value: number | string, label: string, sub: string) => (
    <div className="text-center flex-1 min-w-[88px]">
      <div className="text-lg font-semibold text-gray-900 tabular-nums">{value}</div>
      <div className="text-[11px] font-medium text-gray-700 mt-0.5">{label}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>
    </div>
  )

  const gateDots = (
    <span className="text-base text-gray-700 tabular-nums" aria-hidden>
      {gateComplete >= 1 ? '●' : '○'}
      {gateComplete >= 2 ? '●' : '○'}
    </span>
  )

  /** Phase 1 hero (compliance): only when gate &lt; 2 and not yet showing interim confirmed. */
  const phase1Hero = (() => {
    if (gateComplete >= 2) {
      return null
    }
    if (gateComplete === 1) {
      const subLong =
        'Good start. Complete one more check-in tomorrow to confirm your place and trigger product shipment.'
      if (hasCheckedInToday) {
        return {
          label: 'Check-in 2 of 2',
          headline: 'One more check-in to confirm your place',
          sub: '',
          showCheckinCta: false,
          doneBlock: true,
          ctaLabel: 'Complete check-in 2',
        }
      }
      return {
        label: 'Check-in 2 of 2',
        headline: 'One more check-in to confirm your place',
        sub: subLong,
        showCheckinCta: true,
        doneBlock: false,
        ctaLabel: 'Complete check-in 2',
      }
    }
    return {
      label: 'Check-in 1 of 2',
      headline: 'Secure your place: first check-in',
      sub: 'Your place is reserved for 48 hours. Complete your first two check-ins to secure your spot and trigger product shipment.',
      showCheckinCta: !hasCheckedInToday,
      doneBlock: hasCheckedInToday,
      ctaLabel: 'Check in now',
    }
  })()

  const showInterimSpotConfirmed = complianceGateSatisfied && !cohortConfirmed

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <StudySupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <section>
        <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
          <span className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide">{studyNameLabel}</span>
          {productName} study
        </h1>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        {cohortConfirmed ? (
          studyComplete ? (
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
          )
        ) : showInterimSpotConfirmed ? (
          <div>
            <h2 className="text-[26px] font-bold leading-snug text-gray-900">Your spot is confirmed</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              You are in the study. Your product will be dispatched shortly. Your daily check-ins begin when it arrives. You
              will receive a reminder each morning. Keep your supplement routine as it is until then.
            </p>
          </div>
        ) : phase1Hero ? (
          <div>
            <p className="text-xs font-medium text-gray-500">{phase1Hero.label}</p>
            <div className="mt-3 border-t border-slate-200" />
            <h2 className="mt-4 text-[26px] font-bold leading-snug text-gray-900">{phase1Hero.headline}</h2>
            {phase1Hero.sub ? (
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{phase1Hero.sub}</p>
            ) : null}
            {phase1Hero.doneBlock ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-left">
                <div className="text-sm font-semibold text-emerald-900">
                  <span className="text-emerald-700" aria-hidden>
                    ✓{' '}
                  </span>
                  Done for today
                </div>
                <p className="mt-1 text-[14px] text-emerald-900/90">Come back tomorrow morning for your next check-in.</p>
              </div>
            ) : phase1Hero.showCheckinCta ? (
              <button
                type="button"
                onClick={onOpenCheckin}
                className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                {phase1Hero.ctaLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {!cohortConfirmed && !showInterimSpotConfirmed ? (
        <section className="text-center px-1">
          <p className="text-sm text-gray-800">
            Progress: {gateComplete} of 2 <span className="inline-block min-w-[2.5rem]">{gateDots}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">48 hours to confirm your spot</p>
        </section>
      ) : null}

      <section>
        {cohortConfirmed ? (
          hasCheckedInToday ? (
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
          )
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-wrap justify-center gap-5 sm:gap-6">
        {cohortConfirmed ? (
          <>
            {statCell(checkinCount, 'Check-ins done', 'this study')}
            {statCell(currentStreak, 'Current streak', 'day streak')}
            {statCell(daysRemaining, 'Days remaining', 'days left')}
          </>
        ) : (
          <>
            {statCellCompact(checkinCount, 'Check-ins done', 'this study')}
            {statCellCompact(currentStreak, 'Current streak', 'day streak')}
            {showInterimSpotConfirmed ? (
              <div className="text-center flex-1 min-w-[88px]">
                <div className="text-lg font-semibold text-gray-900 tabular-nums">…</div>
                <div className="text-[11px] font-medium text-gray-700 mt-0.5">Window</div>
                <div className="text-[10px] text-gray-500 mt-0.5">complete</div>
              </div>
            ) : (
              <div className="flex-1 min-w-[88px]">
                <SpotConfirmedCountdown deadlineIso={complianceDeadlineIso} compact />
              </div>
            )}
          </>
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
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="text-gray-800 underline underline-offset-2 hover:text-gray-950 font-medium"
          >
            Need help?
          </button>
        </p>
        <p className="mt-2">
          Stack locked during study · unlocks automatically on {formatStudyEndDate(studyEndDate)}
        </p>
      </footer>
    </div>
  )
}
