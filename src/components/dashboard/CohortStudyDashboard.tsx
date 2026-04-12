'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { cohortParticipantResultPath } from '@/lib/cohortDashboardDeepLink'
import {
  cohortCheckinFieldLabel,
  DEFAULT_COHORT_CHECKIN_FIELDS,
  isSleepShapedCheckinFields,
  normalizeCohortCheckinFields,
} from '@/lib/cohortCheckinFields'
import { getLocalDateYmd } from '@/lib/utils/localDateYmd'
import {
  isDonotageSureSleepStudySlug,
  isSeekingHealthOptimalFocusStudySlug,
} from '@/lib/cohortPartnerBranding'
import { NEUTRAL_STORE_CREDIT_DISPLAY_TITLE } from '@/lib/cohortStudyLandingRewards'
import {
  COGNITIVE_COHORT_STUDY_ASSETS,
  cohortPartnerLogoPublicCandidates,
} from '@/lib/cohortStudyPageAssets'
import {
  COHORT_DASHBOARD_BIOSTACKR_ROW_CLASS,
  COHORT_DASHBOARD_PARTNER_MARK_CLASS,
} from '@/lib/cohortDashboardPartnerLogo'
import {
  cohortArrivalDosingInAppParagraph,
  resolveCohortArrivalDosingKind,
} from '@/lib/cohortArrivalDosing'

export type CohortStartStudyBody = {
  productArrived: 'today' | 'yesterday' | 'few_days_ago' | 'skip'
  tookProductLastNight?: boolean
  firstDoseYmd?: string
}

export interface CohortStudyDashboardProps {
  cohortId: string
  /** Cohort check-in dimensions from `/api/me` (cohorts.checkin_fields). */
  checkinFields?: string[] | null
  /** From `study_landing_reward_config` via /api/me — store credit vs product-supply completion copy. */
  cohortCompletionRewardStoreCredit?: boolean
  cohortStoreCreditTitle?: string | null
  /** Shown as "Welcome back, …" — prefer `profiles` via /api/me `profileWelcomeFirstName`. */
  welcomeFirstName?: string | null
  /** True when cohort_participants.status is `confirmed` and confirmed_at is set (compliance gate cleared in DB). */
  cohortConfirmed: boolean
  /** Confirmed participant only: waiting for product / first study night (not for `applied` / gate). */
  cohortAwaitingStudyStart?: boolean
  /** Set when study_started_at is stored but the first study day is still in the future (e.g. product arrived today). */
  cohortStudyStartedAtIso?: string | null
  /** After successful start-study API: refresh already fired from caller; optionally open check-in. */
  onAfterStudyStarted?: (opts?: { openCheckin?: boolean }) => void
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
  /** From `/api/me` `cohortParticipantResultPublished` — personal summary row published in DB. */
  cohortParticipantResultPublished?: boolean
  studyEndDate: string | null
  onOpenCheckin: () => void
}

/**
 * `donotage-suresleep` → DNA asset; `seeking-health-optimal-focus` → SH public pack; else cohort-folder logos or wordmark.
 * Slug-canonical only (no `brand_name` substring matching).
 */
function CohortDashboardPartnerMark({
  brandDisplay,
  cohortId,
}: {
  brandDisplay: string
  cohortId: string
}) {
  const useDnaPack = isDonotageSureSleepStudySlug(cohortId)
  const useSeekingPack = isSeekingHealthOptimalFocusStudySlug(cohortId)
  const candidates = useMemo(
    () => cohortPartnerLogoPublicCandidates(cohortId, brandDisplay),
    [cohortId, brandDisplay],
  )
  const candidateKey = candidates.join('|')
  const [attempt, setAttempt] = useState(0)
  const [useTextFallback, setUseTextFallback] = useState(false)

  useEffect(() => {
    setAttempt(0)
    setUseTextFallback(false)
  }, [candidateKey])

  if (useDnaPack) {
    return (
      <img
        src="/DNA-logo-black.png"
        alt={brandDisplay}
        className={COHORT_DASHBOARD_PARTNER_MARK_CLASS}
        width={280}
        height={72}
      />
    )
  }

  if (useSeekingPack) {
    return (
      <img
        src={encodeURI(COGNITIVE_COHORT_STUDY_ASSETS.partnerLogo)}
        alt={brandDisplay}
        className={COHORT_DASHBOARD_PARTNER_MARK_CLASS}
        width={280}
        height={72}
      />
    )
  }

  if (useTextFallback || candidates.length === 0) {
    return (
      <span className="text-xl font-bold text-gray-900 sm:text-2xl">{brandDisplay}</span>
    )
  }

  const src = candidates[attempt]
  return (
    <img
      src={encodeURI(src)}
      alt={brandDisplay}
      className={COHORT_DASHBOARD_PARTNER_MARK_CLASS}
      width={280}
      height={72}
      onError={() => {
        if (attempt < candidates.length - 1) {
          setAttempt((a) => a + 1)
        } else {
          setUseTextFallback(true)
        }
      }}
    />
  )
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

function ymdAddDaysLocal(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function lastFiveFirstDoseChoices(todayYmd: string): string[] {
  const out: string[] = []
  for (let i = 1; i <= 5; i++) {
    out.push(ymdAddDaysLocal(todayYmd, -i))
  }
  return out
}

function formatChoiceYmd(ymd: string): string {
  const [Y, M, D] = ymd.split('-').map(Number)
  const dt = new Date(Y, M - 1, D)
  if (Number.isNaN(dt.getTime())) return ymd
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function ProductArrivedModal({
  open,
  onClose,
  productName,
  sleepShapedCohort,
  onSubmit,
  onFlowFinished,
}: {
  open: boolean
  onClose: () => void
  productName: string
  /** When false (cognitive cohort), avoid “tomorrow morning” in success copy. */
  sleepShapedCohort: boolean
  onSubmit: (body: CohortStartStudyBody) => Promise<{ openCheckin: boolean }>
  onFlowFinished: (openCheckin: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [screen, setScreen] = useState<'arrival' | 'yesterday-followup' | 'few-days' | 'success'>('arrival')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setBusy(false)
      setErr(null)
      setScreen('arrival')
      setSuccessMsg(null)
    }
  }, [open])

  if (!open) return null

  const todayYmd = getLocalDateYmd()
  const fewDaysChoices = lastFiveFirstDoseChoices(todayYmd)

  const finishWithApi = async (body: CohortStartStudyBody, successMessage?: string) => {
    setBusy(true)
    setErr(null)
    try {
      const { openCheckin } = await onSubmit(body)
      if (successMessage) {
        setSuccessMsg(successMessage)
        setScreen('success')
        return
      }
      onClose()
      onFlowFinished(openCheckin)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const successView = screen === 'success' && successMsg

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-arrived-title"
      onClick={(e) => {
        if (!busy && e.target === e.currentTarget) onClose()
      }}
    >
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        {successView ? (
          <>
            <h3 id="product-arrived-title" className="text-lg font-semibold text-gray-900">
              All set
            </h3>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">{successMsg}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onClose()
                onFlowFinished(false)
              }}
              className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Done
            </button>
          </>
        ) : screen === 'yesterday-followup' ? (
          <>
            <h3 id="product-arrived-title" className="text-lg font-semibold text-gray-900">
              Did you take {productName} last night?
            </h3>
            {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  finishWithApi({ productArrived: 'yesterday', tookProductLastNight: true }, undefined)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-slate-50 disabled:opacity-50"
              >
                Yes
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  finishWithApi(
                    { productArrived: 'yesterday', tookProductLastNight: false },
                    sleepShapedCohort
                      ? 'Take it tonight, then check in tomorrow morning.'
                      : 'Take it tonight, then check in tomorrow.',
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-slate-50 disabled:opacity-50"
                           >
                No
              </button>
            </div>
          </>
        ) : screen === 'few-days' ? (
          <>
            <h3 id="product-arrived-title" className="text-lg font-semibold text-gray-900">
              When did you first take it?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Pick the first evening you took it. Your study days are counted from that date.
            </p>
            {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
            <div className="mt-4 grid gap-2">
              {fewDaysChoices.map((ymd) => (
                <button
                  key={ymd}
                  type="button"
                  disabled={busy}
                  onClick={() => finishWithApi({ productArrived: 'few_days_ago', firstDoseYmd: ymd }, undefined)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-slate-50 disabled:opacity-50"
                >
                  {formatChoiceYmd(ymd)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h3 id="product-arrived-title" className="text-lg font-semibold text-gray-900">
              When did your product arrive?
            </h3>
            <p className="mt-2 text-sm text-gray-600">Optional. Skip if you prefer.</p>
            {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  finishWithApi(
                    { productArrived: 'today' },
                    sleepShapedCohort
                      ? `Take ${productName} tonight, about 45 minutes before bed. Check in tomorrow morning.`
                      : `Take ${productName} tonight, about 45 minutes before bed. Check in tomorrow.`,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-slate-50 disabled:opacity-50"
              >
                Today
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setErr(null)
                  setScreen('yesterday-followup')
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-slate-50 disabled:opacity-50"
              >
                Yesterday
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setErr(null)
                  setScreen('few-days')
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-slate-50 disabled:opacity-50"
              >
                A few days ago
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => finishWithApi({ productArrived: 'skip' }, undefined)}
                className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-center text-sm font-medium text-gray-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
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

  // Reset whenever visibility changes so a stale `done` from a prior open cannot skip the form.
  useEffect(() => {
    setReason('')
    setBusy(false)
    setDone(false)
    setErr(null)
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
          <h3 className="text-lg font-semibold text-gray-900">{done ? 'Thanks' : 'Message support'}</h3>
          <button type="button" className="text-sm text-gray-500 hover:text-gray-800" onClick={onClose}>
            Close
          </button>
        </div>
        {done ? (
          <p className="mt-3 text-sm text-emerald-800 font-medium leading-relaxed">
            Great — we&apos;ve received your message and will get back to you shortly.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600">
              Choose one option. We email the study team with your account details.
            </p>
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
  cohortId,
  checkinFields: checkinFieldsProp = null,
  cohortCompletionRewardStoreCredit = false,
  cohortStoreCreditTitle = null,
  welcomeFirstName = null,
  cohortConfirmed,
  cohortAwaitingStudyStart = false,
  cohortStudyStartedAtIso = null,
  onAfterStudyStarted,
  complianceDeadlineIso,
  brandName,
  productName,
  checkinCount,
  studyDays,
  startDateIso: _startDateIso,
  hasCheckedInToday,
  currentStreak: _currentStreak,
  currentDay,
  daysRemaining,
  studyComplete,
  cohortParticipantResultPublished = false,
  studyEndDate: _studyEndDate,
  onOpenCheckin,
}: CohortStudyDashboardProps) {
  void _startDateIso
  void _currentStreak
  void _studyEndDate
  const [supportOpen, setSupportOpen] = useState(false)
  const [productArrivedOpen, setProductArrivedOpen] = useState(false)
  const progressPct =
    studyComplete ? 100 : currentDay <= 0 ? 0 : Math.min(100, (currentDay / studyDays) * 100)

  /** Product-shipment holding is only after DB confirmation — never for `applied` / compliance phase. */
  const awaitingProductHolding = Boolean(cohortConfirmed && cohortAwaitingStudyStart)

  /**
   * Pre-study baseline: distinct check-in days since enrollment (`cohortCheckinCount` from /api/me).
   * UI-only threshold before the product-arrival flow is offered as a primary action.
   */
  const BASELINE_REQUIRED_CHECKINS = 3
  const baselineCheckinsComplete = Math.min(checkinCount, BASELINE_REQUIRED_CHECKINS)
  const canStartStudyFromProduct = checkinCount >= BASELINE_REQUIRED_CHECKINS

  /** While awaiting product (confirmed only), hero gate shows 2/2; `checkinCount` still reflects ongoing pre-study check-ins. */
  const gateComplete = awaitingProductHolding
    ? 2
    : Math.min(2, Math.max(0, checkinCount))
  /** Two qualifying check-ins done; cron may not have set confirmed_at yet. */
  const complianceGateSatisfied = gateComplete >= 2
  const brandDisplay = String(brandName || '').trim() || 'Study partner'
  const isSleepShapedCohort = useMemo(() => {
    const raw =
      Array.isArray(checkinFieldsProp) && checkinFieldsProp.length > 0
        ? checkinFieldsProp
        : DEFAULT_COHORT_CHECKIN_FIELDS
    return isSleepShapedCheckinFields(normalizeCohortCheckinFields(raw))
  }, [checkinFieldsProp])
  const welcomeName =
    typeof welcomeFirstName === 'string' && welcomeFirstName.trim() !== ''
      ? welcomeFirstName.trim()
      : 'there'

  const arrivalDosingParagraph = useMemo(() => {
    const kind = resolveCohortArrivalDosingKind({
      partnerBrandName: brandDisplay,
      productName,
      cohortSlug: cohortId,
    })
    return cohortArrivalDosingInAppParagraph(kind)
  }, [brandDisplay, productName, cohortId])

  const measureItems = useMemo(() => {
    const raw =
      Array.isArray(checkinFieldsProp) && checkinFieldsProp.length > 0
        ? checkinFieldsProp
        : DEFAULT_COHORT_CHECKIN_FIELDS
    const normalized = normalizeCohortCheckinFields(raw)
    return normalized.map((k) => cohortCheckinFieldLabel(k, normalized))
  }, [checkinFieldsProp])

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
        'Complete your second check-in to confirm your place and trigger shipment.'
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
      sub: 'You have 48 hours to complete 2 check-ins. This confirms your place and triggers product shipment.',
      showCheckinCta: !hasCheckedInToday,
      doneBlock: hasCheckedInToday,
      ctaLabel: 'Start first check-in',
    }
  })()

  const showInterimSpotConfirmed = complianceGateSatisfied && !cohortConfirmed

  const localTodayYmd = getLocalDateYmd()
  const studyStartYmd =
    cohortStudyStartedAtIso != null && String(cohortStudyStartedAtIso).trim() !== ''
      ? String(cohortStudyStartedAtIso).trim().slice(0, 10)
      : null
  const pendingFirstStudyNight = Boolean(studyStartYmd && studyStartYmd > localTodayYmd)

  const startStudyApi = async (body: CohortStartStudyBody) => {
    const res = await fetch('/api/cohort/start-study', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, calendarTodayYmd: getLocalDateYmd() }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(String((j as { error?: string }).error || 'Could not start study'))
    }
    try {
      window.dispatchEvent(new Event('dashboard:refresh'))
    } catch {}
    return { openCheckin: Boolean((j as { openCheckin?: boolean }).openCheckin) }
  }

  const onArrivalFlowFinished = (openCheckin: boolean) => {
    onAfterStudyStarted?.({ openCheckin })
  }

  return (
    <div id="cohort-study-dashboard" className="space-y-6 max-w-xl mx-auto">
      <ProductArrivedModal
        open={productArrivedOpen}
        onClose={() => setProductArrivedOpen(false)}
        productName={productName}
        sleepShapedCohort={isSleepShapedCohort}
        onSubmit={startStudyApi}
        onFlowFinished={onArrivalFlowFinished}
      />
      <StudySupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <CohortDashboardPartnerMark
            brandDisplay={brandDisplay}
            cohortId={cohortId}
          />
          <img
            src={encodeURI('/BIOSTACKR LOGO 2.png')}
            alt="BioStackr"
            className={COHORT_DASHBOARD_BIOSTACKR_ROW_CLASS}
            width={200}
            height={48}
          />
        </div>
        <p className="text-base sm:text-lg font-medium text-gray-900 mb-1">
          Welcome back, {welcomeName}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
          {productName} study by {brandDisplay}
        </h1>
      </section>

      <section
        className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
          awaitingProductHolding && !pendingFirstStudyNight ? 'p-5 sm:p-6' : 'p-6'
        }`}
      >
        {awaitingProductHolding ? (
          pendingFirstStudyNight ? (
              <>
                <h2 className="text-[26px] font-bold leading-snug text-gray-900">First study day</h2>
                <p className="mt-5 text-base font-semibold text-gray-900">{productName}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-800">{arrivalDosingParagraph}</p>
                <p className="mt-3 text-sm text-gray-500">
                  If anything feels off, follow the product guidance.
                </p>
              </>
            ) : (
              <div role="region" aria-label="While you wait for your product">
                <h2 className="text-[22px] sm:text-[24px] font-bold leading-snug tracking-tight text-gray-900">
                  You&apos;re in — your spot is confirmed
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-800">
                  Nice work — you&apos;re now part of the study.
                </p>
                <p className="mt-5 text-[15px] leading-relaxed text-gray-800">
                  While you wait for your product, keep checking in each day so we can capture how you feel right now.
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
                  Once your product arrives, we&rsquo;ll measure what changes.
                </p>
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900">Next steps</h3>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-gray-800">
                    <li>Continue checking in for a few days so we can build your baseline</li>
                    <li>Your product will arrive, and you&apos;ll start taking it</li>
                    <li>We&apos;ll compare your results before and after</li>
                  </ol>
                </div>
                {hasCheckedInToday ? (
                  <p className="mt-8 text-[15px] leading-relaxed text-gray-800">
                    You&apos;ve checked in today. Come back tomorrow for your next baseline check-in.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenCheckin}
                    className="mt-8 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Check in now
                  </button>
                )}
                {canStartStudyFromProduct ? (
                  <button
                    type="button"
                    onClick={() => setProductArrivedOpen(true)}
                    className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-slate-50"
                  >
                    Product arrived? Start your study
                  </button>
                ) : (
                  <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-gray-600">
                    Your product is on the way
                  </p>
                )}
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-left sm:px-5">
                  <p className="text-sm font-semibold text-gray-900">{productName}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-gray-800">{arrivalDosingParagraph}</p>
                  <p className="mt-2 text-xs leading-snug text-gray-500">
                    If anything feels off, follow the product guidance.
                  </p>
                </div>
              </div>
            )
        ) : cohortConfirmed ? (
          studyComplete ? (
            <div>
              <div className="text-3xl font-bold text-gray-900">Study complete</div>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-800">
                Congratulations — you&apos;ve completed the study. Thank you for taking part. You do not need to complete
                any more check-ins for this study.
              </p>
              {cohortParticipantResultPublished ? (
                <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
                  Your personal results are ready. You can view your summary below whenever you like.
                </p>
              ) : (
                <>
                  <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
                    Your personal results are now being prepared.
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                    We&apos;ll email you with a link as soon as your results are ready.
                  </p>
                </>
              )}
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-5 sm:px-5">
                <h3 className="text-base font-semibold text-gray-900">Your rewards</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-800">
                  You&apos;ve unlocked:
                </p>
                <ul className="mt-2 list-disc pl-5 text-[15px] leading-relaxed text-gray-800 space-y-1">
                  <li>3 months of BioStackr Pro</li>
                  {cohortCompletionRewardStoreCredit ? (
                    <li>
                      {(typeof cohortStoreCreditTitle === 'string' && cohortStoreCreditTitle.trim() !== ''
                        ? cohortStoreCreditTitle.trim()
                        : NEUTRAL_STORE_CREDIT_DISPLAY_TITLE) + ' from ' + brandDisplay}
                    </li>
                  ) : (
                    <li>A 3-month supply of {productName}</li>
                  )}
                </ul>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                  You&apos;ll receive full details with your results.
                </p>
              </div>
              {cohortParticipantResultPublished ? (
                <Link
                  href={cohortParticipantResultPath()}
                  className="mt-6 inline-flex w-full justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto"
                >
                  View your personal results
                </Link>
              ) : null}
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900">
                Day {currentDay} of {studyDays}
              </div>
              {currentDay === 1 ? (
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                  Your study starts from your first check-in today, so we can measure changes consistently.
                </p>
              ) : null}
                           <div className="mt-4 h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-900 transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-gray-600">{daysRemaining} days remaining</p>
            </>
          )
        ) : showInterimSpotConfirmed ? (
          <div>
            <h2 className="text-[26px] font-bold leading-snug text-gray-900">Your spot is confirmed</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              You are in the study. Your product will be dispatched shortly. Your daily check-ins start when it arrives. You
              {isSleepShapedCohort ? (
                <> will receive a reminder each morning. </>
              ) : (
                <> will receive a daily reminder. </>
              )}
              Keep your supplement routine as it is until then.
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
                  First check-in complete.
                </div>
                <p className="mt-1 text-[14px] text-emerald-900/90 leading-snug">
                  {isSleepShapedCohort
                    ? 'Come back tomorrow morning for your second check-in to confirm your place and trigger shipment.'
                    : 'Come back tomorrow for your second check-in to confirm your place and trigger shipment.'}
                </p>
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

      {awaitingProductHolding && !pendingFirstStudyNight ? (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm sm:px-5">
          <p className="text-[13px] font-medium text-gray-700">
            Baseline progress: {baselineCheckinsComplete} of {BASELINE_REQUIRED_CHECKINS} check-ins complete
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-gray-500">
            Complete your baseline before starting the study.
          </p>
        </section>
      ) : null}

      {!cohortConfirmed && !showInterimSpotConfirmed && !awaitingProductHolding ? (
        <section className="text-center px-1 space-y-3">
          <div>
            <p className="text-sm text-gray-800">
              Progress: {gateComplete} of 2 <span className="inline-block min-w-[2.5rem]">{gateDots}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">48 hours to confirm your spot</p>
          </div>
          {complianceDeadlineIso && gateComplete < 2 ? (
            <div className="flex justify-center">
              <SpotConfirmedCountdown deadlineIso={complianceDeadlineIso} compact />
            </div>
          ) : null}
        </section>
      ) : null}

      {cohortConfirmed && !studyComplete && !awaitingProductHolding ? (
        <section>
          {hasCheckedInToday ? (
            <div className="rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/60 p-4 sm:p-5">
              <div className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                <span className="text-emerald-700" aria-hidden="true">
                  ✓
                </span>{' '}
                Checked in today
              </div>
              {currentDay === 1 ? (
                <>
                  <p className="mt-2 text-sm font-semibold text-gray-900">First one&apos;s done.</p>
                  <p className="mt-2 text-sm text-gray-700">
                    {isSleepShapedCohort
                      ? 'Come back tomorrow morning after you wake up.'
                      : 'Come back tomorrow.'}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-700">
                  {isSleepShapedCohort
                    ? 'Great work. Come back tomorrow morning after you wake up.'
                    : 'Great work. Come back tomorrow.'}
                </p>
              )}
              <button
                type="button"
                className="mt-3 text-sm text-gray-600 underline underline-offset-2 hover:text-gray-900"
                onClick={onOpenCheckin}
              >
                Come back tomorrow for your next check-in
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              {currentDay === 1 ? (
                <>
                  <div className="text-sm font-semibold text-gray-900">Day 1 — you&apos;re in.</div>
                  <p className="mt-2 text-sm text-gray-700">
                    {isSleepShapedCohort
                      ? 'A quick morning check-in each day — about 30 seconds. You&apos;ve got this.'
                      : 'A quick daily check-in — about 30 seconds. You&apos;ve got this.'}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-gray-900">Time for today&apos;s check-in.</div>
                  <p className="mt-2 text-sm text-gray-700">30 seconds. Same questions. Keep the streak going.</p>
                </>
              )}
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
      ) : null}

      <section className="mt-14 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-3 sm:px-3.5 sm:py-3">
        <h2 className="text-xs font-medium text-gray-400">{"What you'll rate each day"}</h2>
        <p className="mt-1.5 text-[11px] leading-snug text-gray-400">Same as your first check-ins.</p>
        <ul className="mt-2 list-none space-y-1 text-xs leading-snug text-gray-500">
          {measureItems.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
        <p className="mt-2.5 text-[11px] leading-relaxed text-gray-400">
          We track this over {studyDays} days; results are shared when the study ends.
        </p>
      </section>

      <footer className="text-xs text-gray-500 leading-relaxed pb-8">
        <p>
          Study partner: {brandName || 'your brand'}.{' '}
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="text-gray-800 underline underline-offset-2 hover:text-gray-950 font-medium"
          >
            Need help?
          </button>
        </p>
      </footer>
    </div>
  )
}
