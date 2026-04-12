'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  setCohortCookie,
  setCohortBrandCookie,
  COHORT_QUALIFICATION_STORAGE_KEY,
  type CohortQualificationDraftV1,
} from '@/lib/cohort'
import {
  validateQualificationFreeText,
  QUALIFICATION_WAITLIST_HEADLINE,
} from '@/lib/qualificationFreeText'
import { STUDY_COHORT_FULL_WAITLIST_SOURCE } from '@/lib/studyCohortFullWaitlistSource'

function qualFailStorageKey(slug: string): string {
  return `bs_cohort_qual_fails_${String(slug || '').trim().toLowerCase()}`
}

const PRESCRIBE_EXIT =
  'Thanks for your interest. For this study we need participants not currently on prescription sleep medication. We hope to include you in a future study.'

const PRESCRIBE_EXIT_GENERAL =
  'Thanks for your interest. For this study we need participants who can keep prescription medications stable during the baseline window. We hope to include you in a future study.'

const CURRENT_PRODUCT_EXIT =
  'Thanks for your interest. This study needs participants with a clean baseline, which means not currently taking the product. We hope to include you in a future study.'

const SLEEP_SCREENING_EXIT =
  "Based on your answers, you may not be the right fit for this study. We're looking for participants who currently experience sleep difficulties. Thank you for your interest."

const COGNITIVE_SCREENING_EXIT =
  "Based on your answers, you may not be the right fit for this study. We're looking for participants who currently experience focus or cognitive challenges this product may help with. Thank you for your interest."

const COGNITIVE_RATING_EXIT =
  "Based on your answers, you may not be the right fit for this study. We're looking for participants with room to show a measurable change in focus and mental clarity. Thank you for your interest."

const RUST = '#C84B2F'

const SLEEP_QUALITY_OPTIONS = [
  { value: 1, range: '1–3', quality: 'Very poor' },
  { value: 2, range: '4–5', quality: 'Poor' },
  { value: 3, range: '6', quality: 'Below average' },
  { value: 4, range: '7–8', quality: 'Good' },
  { value: 5, range: '9–10', quality: 'Excellent' },
] as const

const SLEEP_ISSUE_OPTIONS = [
  'Hard to fall asleep',
  'Wake during the night',
  'Wake too early',
  "Don't feel rested",
  'I sleep reasonably well',
] as const

const COGNITIVE_ISSUE_OPTIONS = [
  'Brain fog or sluggish thinking',
  'Hard to focus for long periods',
  'Afternoon energy or clarity dips',
  'Mental fatigue on demanding days',
  'Generally sharp — no major issues',
] as const

const BORDER_SUBTLE = '#d4cfc8'
const BORDER_SELECTED = RUST

const pillOuterClass =
  'flex w-full flex-col gap-3 sm:flex-row sm:gap-3'

function selectorButtonClass(selected: boolean): string {
  const base =
    'w-full rounded-[8px] px-5 py-3 text-left text-[14px] leading-snug font-normal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
  if (selected) {
    return `${base} text-white focus-visible:ring-[#C84B2F]`
  }
  return `${base} bg-white text-neutral-900 focus-visible:ring-neutral-400`
}

function selectorButtonStyle(selected: boolean): CSSProperties {
  return {
    border: `1.5px solid ${selected ? BORDER_SELECTED : BORDER_SUBTLE}`,
    padding: '12px 20px',
    fontSize: 14,
    background: selected ? RUST : '#fff',
    color: selected ? '#fff' : undefined,
  }
}

export function CohortQualificationSection({
  cohortSlug,
  cohortBrandName,
  productName,
  cohortVisibleCapacityFull = false,
  enrollmentOpen = true,
  qualificationShape,
  studyDays = 21,
}: {
  cohortSlug: string
  cohortBrandName: string
  productName: string
  /** True when study page visible cap is reached (display_capacity, else max_participants). */
  cohortVisibleCapacityFull?: boolean
  /** When false (e.g. cohorts.status is draft), show message only — no apply flow. */
  enrollmentOpen?: boolean
  /** From `checkin_fields` on the server — sleep vs cognitive screening copy. */
  qualificationShape: 'sleep' | 'cognitive'
  studyDays?: number
}) {
  const router = useRouter()
  const [issue, setIssue] = useState('')
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [sleepIssue, setSleepIssue] = useState<string | null>(null)
  const [cognitiveQuality, setCognitiveQuality] = useState<number | null>(null)
  const [cognitiveIssue, setCognitiveIssue] = useState<string | null>(null)
  const [currentProduct, setCurrentProduct] = useState<'yes' | 'no' | ''>('')
  const [prescription, setPrescription] = useState<'yes' | 'no' | ''>('')
  const [commitment, setCommitment] = useState(false)
  const [issueThanks, setIssueThanks] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [sleepQualityError, setSleepQualityError] = useState(false)
  const [sleepIssueError, setSleepIssueError] = useState(false)
  const [cognitiveQualityError, setCognitiveQualityError] = useState(false)
  const [cognitiveIssueError, setCognitiveIssueError] = useState(false)
  const [currentProductError, setCurrentProductError] = useState(false)
  const [prescError, setPrescError] = useState(false)
  const [hardExit, setHardExit] = useState<string | null>(null)
  const [waitlistMode, setWaitlistMode] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistBusy, setWaitlistBusy] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [waitlistErr, setWaitlistErr] = useState<string | null>(null)
  const [showCapacityWaitlist, setShowCapacityWaitlist] = useState(false)

  const slugNorm = String(cohortSlug || '').trim().toLowerCase()

  useEffect(() => {
    if (!slugNorm) return
    try {
      const n = parseInt(sessionStorage.getItem(qualFailStorageKey(slugNorm)) || '0', 10) || 0
      if (n >= 3) setWaitlistMode(true)
    } catch {
      /* ignore */
    }
  }, [slugNorm])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setHardExit(null)
    setIssueError(null)
    setSleepQualityError(false)
    setSleepIssueError(false)
    setCognitiveQualityError(false)
    setCognitiveIssueError(false)
    setCurrentProductError(false)
    setPrescError(false)

    const textCheck = validateQualificationFreeText(issue.trim())
    if (!textCheck.ok) {
      setIssueThanks(false)
      setIssueError(textCheck.error)
      let n = 0
      try {
        n = parseInt(sessionStorage.getItem(qualFailStorageKey(slugNorm)) || '0', 10) || 0
      } catch {
        n = 0
      }
      n += 1
      try {
        sessionStorage.setItem(qualFailStorageKey(slugNorm), String(n))
      } catch {
        /* ignore */
      }
      if (n >= 3) {
        setWaitlistMode(true)
        setIssueError(null)
      }
      return
    }
    try {
      sessionStorage.removeItem(qualFailStorageKey(slugNorm))
    } catch {
      /* ignore */
    }
    if (qualificationShape === 'sleep') {
      if (sleepQuality == null) {
        setSleepQualityError(true)
        return
      }
      if (!sleepIssue) {
        setSleepIssueError(true)
        return
      }
      if (sleepIssue === 'I sleep reasonably well') {
        setHardExit(SLEEP_SCREENING_EXIT)
        return
      }
    } else {
      if (cognitiveQuality == null) {
        setCognitiveQualityError(true)
        return
      }
      if (!cognitiveIssue) {
        setCognitiveIssueError(true)
        return
      }
      if (cognitiveIssue === 'Generally sharp — no major issues') {
        setHardExit(COGNITIVE_SCREENING_EXIT)
        return
      }
    }
    if (currentProduct === '') {
      setCurrentProductError(true)
      return
    }
    if (currentProduct === 'yes') {
      setHardExit(CURRENT_PRODUCT_EXIT)
      return
    }
    if (prescription === '') {
      setPrescError(true)
      return
    }
    if (prescription === 'yes') {
      setHardExit(qualificationShape === 'sleep' ? PRESCRIBE_EXIT : PRESCRIBE_EXIT_GENERAL)
      return
    }
    if (!commitment) return

    const slug = String(cohortSlug || '').trim().toLowerCase()
    if (!slug) {
      router.push('/signup/cohort')
      return
    }

    const sqOpt =
      qualificationShape === 'sleep'
        ? SLEEP_QUALITY_OPTIONS.find((o) => o.value === sleepQuality)
        : SLEEP_QUALITY_OPTIONS.find((o) => o.value === cognitiveQuality)
    const sqLabel = sqOpt ? `${sqOpt.range} ${sqOpt.quality}` : String(qualificationShape === 'sleep' ? sleepQuality : cognitiveQuality)
    const combinedIssue =
      qualificationShape === 'sleep'
        ? [
            issue.trim(),
            `Sleep quality (last month): ${sqLabel} [value=${sleepQuality}]`,
            `Primary sleep issue: ${sleepIssue}`,
          ].join('\n| ')
        : [
            issue.trim(),
            `Focus / mental clarity (last month): ${sqLabel} [value=${cognitiveQuality}]`,
            `Primary cognitive issue: ${cognitiveIssue}`,
          ].join('\n| ')

    if (cohortVisibleCapacityFull) {
      setShowCapacityWaitlist(true)
      return
    }

    setCohortCookie(slug)
    setCohortBrandCookie(cohortBrandName)
    try {
      const draft: CohortQualificationDraftV1 = { v: 1, cohortSlug: slug, issue: combinedIssue }
      sessionStorage.setItem(COHORT_QUALIFICATION_STORAGE_KEY, JSON.stringify(draft))
    } catch {
      /* still proceed; signup page will redirect if draft missing */
    }
    router.push('/signup/cohort')
  }

  const productLabel = String(productName || '').trim() || 'this product'

  const onWaitlistSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setWaitlistErr(null)
    const em = waitlistEmail.trim().toLowerCase()
    if (!slugNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setWaitlistErr('Enter a valid email.')
      return
    }
    setWaitlistBusy(true)
    try {
      const res = await fetch('/api/study-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohort_slug: slugNorm,
          email: em,
          ...(showCapacityWaitlist ? { source: STUDY_COHORT_FULL_WAITLIST_SOURCE } : {}),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setWaitlistErr(String((j as { error?: string }).error || 'Something went wrong.'))
        setWaitlistBusy(false)
        return
      }
      setWaitlistDone(true)
    } catch {
      setWaitlistErr('Something went wrong.')
    } finally {
      setWaitlistBusy(false)
    }
  }

  if (!enrollmentOpen) {
    return (
      <section id="cohort-apply-form" className="scroll-mt-24">
        <div
          className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-6 py-8 sm:px-8"
          style={{
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            borderRadius: 12,
          }}
        >
          <h2 className="text-[18px] font-bold text-neutral-900">Enrollment not open</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            This study page is visible for preview, but applications are not available until the study is active.
          </p>
        </div>
      </section>
    )
  }

  if (hardExit) {
    return (
      <section id="cohort-apply-form" className="scroll-mt-24">
        <div
          className="rounded-xl border bg-white px-6 py-8 sm:px-8"
          style={{
            borderColor: '#e5e2dc',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            borderRadius: 12,
          }}
        >
          <p className="text-sm text-neutral-700 leading-relaxed">{hardExit}</p>
        </div>
      </section>
    )
  }

  if (showCapacityWaitlist) {
    return (
      <section id="cohort-apply-form" className="scroll-mt-24">
        <div
          className="mx-auto max-w-[680px] rounded-xl border bg-white px-6 py-8 sm:px-8"
          style={{
            borderColor: '#e5e2dc',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            borderRadius: 12,
          }}
        >
          <h2 className="text-[20px] font-bold text-neutral-900">This study is now full</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            Leave your email and we&apos;ll contact you if a spot opens or when we run our next study.
          </p>
          {waitlistDone ? (
            <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
              We have saved your email and may reach out if capacity changes.
            </p>
          ) : (
            <form onSubmit={onWaitlistSubmit} className="mt-6 space-y-3">
              <label htmlFor="waitlist-email-capacity" className="block text-sm font-medium text-neutral-800">
                Email address
              </label>
              <input
                id="waitlist-email-capacity"
                type="email"
                autoComplete="email"
                value={waitlistEmail}
                onChange={(e) => {
                  setWaitlistEmail(e.target.value)
                  setWaitlistErr(null)
                }}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="you@example.com"
              />
              {waitlistErr && <p className="text-sm text-red-600">{waitlistErr}</p>}
              <button
                type="submit"
                disabled={waitlistBusy}
                className="w-full rounded-[8px] bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
              >
                {waitlistBusy ? 'Saving…' : 'Join waitlist'}
              </button>
            </form>
          )}
        </div>
      </section>
    )
  }

  if (waitlistMode) {
    return (
      <section id="cohort-apply-form" className="scroll-mt-24">
        <div
          className="rounded-xl border bg-white px-6 py-8 sm:px-8"
          style={{
            borderColor: '#e5e2dc',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            borderRadius: 12,
          }}
        >
          <p className="text-sm font-medium text-neutral-900 leading-relaxed">{QUALIFICATION_WAITLIST_HEADLINE}</p>
          {waitlistDone ? (
            <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
              We&apos;ve saved your email. If a spot opens up, we may reach out.
            </p>
          ) : (
            <form onSubmit={onWaitlistSubmit} className="mt-6 space-y-3">
              <label htmlFor="waitlist-email" className="block text-sm font-medium text-neutral-800">
                Email address
              </label>
              <input
                id="waitlist-email"
                type="email"
                autoComplete="email"
                value={waitlistEmail}
                onChange={(e) => {
                  setWaitlistEmail(e.target.value)
                  setWaitlistErr(null)
                }}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="you@example.com"
              />
              {waitlistErr && <p className="text-sm text-red-600">{waitlistErr}</p>}
              <button
                type="submit"
                disabled={waitlistBusy}
                className="w-full rounded-[8px] bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
              >
                {waitlistBusy ? 'Saving…' : 'Join waitlist'}
              </button>
            </form>
          )}
        </div>
      </section>
    )
  }

  const days = Math.max(1, Math.floor(Number(studyDays) || 21))

  return (
    <section id="cohort-apply-form" className="scroll-mt-24">
      <h2 className="text-center text-[22px] font-semibold text-neutral-900 sm:text-[24px]">
        Apply to join this {days}-day study
      </h2>
      <div className="mx-auto mt-6 max-w-[680px] text-center text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
        <p>
          We&apos;ll review your application and confirm your place if selected.
        </p>
      </div>

      <div
        className="mx-auto mt-8 max-w-[680px] rounded-xl border bg-white"
        style={{
          borderColor: '#e5e2dc',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderRadius: 12,
          padding: 44,
        }}
      >
        <form onSubmit={onSubmit} className="block" noValidate>
          <div className="mb-8">
            <label htmlFor="cohort-issue" className="block text-sm font-medium text-neutral-800">
              What is the main issue you&apos;re hoping this supplement will help with?
            </label>
            {qualificationShape === 'sleep' ? (
              <>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                  e.g. I wake up around 3am most nights and can&apos;t get back to sleep before my alarm.
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                  e.g. I feel exhausted in the morning even when I&apos;ve been in bed for eight hours.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                  e.g. I struggle to stay focused through long meetings or deep work blocks.
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                  e.g. My thinking feels fuzzy on busy days even when I&apos;ve slept enough.
                </p>
              </>
            )}
            <div className="relative mt-3">
              <textarea
                id="cohort-issue"
                name="issue"
                rows={4}
                value={issue}
                onChange={(e) => {
                  setIssue(e.target.value)
                  setIssueThanks(false)
                  setIssueError(null)
                }}
                onBlur={() => {
                  const t = issue.trim()
                  if (t.length > 0 && validateQualificationFreeText(t).ok) {
                    setIssueThanks(true)
                  } else {
                    setIssueThanks(false)
                  }
                }}
                placeholder="Your answer…"
                className="min-h-[100px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-[#C84B2F] focus:outline-none focus:ring-1 focus:ring-[#C84B2F]"
              />
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
              Specific answers help us select the right participants.
            </p>
            {issueThanks && !issueError && (
              <p className="mt-2 text-[13px] leading-relaxed text-emerald-700">
                Thanks — noted.
              </p>
            )}
            {issueError && <p className="mt-1.5 text-sm text-red-600">{issueError}</p>}
          </div>

          {qualificationShape === 'sleep' ? (
            <>
              <div className="mb-8">
                <div className="text-sm font-medium text-neutral-800">
                  How would you rate your sleep quality over the last month?
                </div>
                <div
                  className="mt-3 rounded-xl border bg-neutral-50/50 p-1.5 sm:p-2"
                  style={{ borderColor: BORDER_SUBTLE }}
                  role="group"
                  aria-label="Sleep quality scale"
                >
                  <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                    {SLEEP_QUALITY_OPTIONS.map(({ value, range, quality }) => {
                      const selected = sleepQuality === value
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`rounded-lg px-0.5 py-2.5 text-center transition-all sm:px-1 sm:py-3 ${
                            selected
                              ? 'shadow-sm ring-2 ring-white'
                              : 'bg-white text-neutral-800 hover:bg-neutral-100/90'
                          }`}
                          style={
                            selected
                              ? { background: RUST, color: '#fff' }
                              : { border: '1px solid #e8e4de' }
                          }
                          onClick={() => {
                            if (value === 4 || value === 5) {
                              setHardExit(SLEEP_SCREENING_EXIT)
                              return
                            }
                            setSleepQuality(value)
                            setSleepQualityError(false)
                          }}
                        >
                          <span className="block text-[10px] font-semibold tabular-nums sm:text-[12px]">{range}</span>
                          <span
                            className={`mt-0.5 block text-[9px] font-normal leading-tight sm:text-[11px] ${
                              selected ? 'text-white/95' : 'text-neutral-600'
                            }`}
                          >
                            {quality}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">
                  We select participants with current sleep disruption.
                </p>
                {sleepQualityError && (
                  <p className="mt-2 text-sm text-red-600">Please select how you&apos;ve been sleeping overall.</p>
                )}
              </div>

              <div className="mb-8">
                <div className="text-sm font-medium text-neutral-800">What best describes your main sleep issue?</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SLEEP_ISSUE_OPTIONS.map((opt) => {
                    const selected = sleepIssue === opt
                    const deemph = opt === 'I sleep reasonably well'
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSleepIssue(opt)
                          setSleepIssueError(false)
                        }}
                        className={`max-w-full rounded-full border px-4 py-2.5 text-left text-[13px] leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C84B2F] focus-visible:ring-offset-2 ${
                          deemph && !selected
                            ? 'border-dashed border-neutral-300 bg-neutral-50/70 text-neutral-500'
                            : !selected
                              ? 'border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400'
                              : 'border-transparent text-white shadow-sm'
                        }`}
                        style={selected ? { background: RUST, borderColor: 'transparent' } : undefined}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {sleepIssueError && (
                  <p className="mt-2 text-sm text-red-600">Please select the option that fits you best.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="text-sm font-medium text-neutral-800">
                  How would you rate your focus and mental clarity over the last month?
                </div>
                <div
                  className="mt-3 rounded-xl border bg-neutral-50/50 p-1.5 sm:p-2"
                  style={{ borderColor: BORDER_SUBTLE }}
                  role="group"
                  aria-label="Focus and mental clarity scale"
                >
                  <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                    {SLEEP_QUALITY_OPTIONS.map(({ value, range, quality }) => {
                      const selected = cognitiveQuality === value
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`rounded-lg px-0.5 py-2.5 text-center transition-all sm:px-1 sm:py-3 ${
                            selected
                              ? 'shadow-sm ring-2 ring-white'
                              : 'bg-white text-neutral-800 hover:bg-neutral-100/90'
                          }`}
                          style={
                            selected
                              ? { background: RUST, color: '#fff' }
                              : { border: '1px solid #e8e4de' }
                          }
                          onClick={() => {
                            if (value === 4 || value === 5) {
                              setHardExit(COGNITIVE_RATING_EXIT)
                              return
                            }
                            setCognitiveQuality(value)
                            setCognitiveQualityError(false)
                          }}
                        >
                          <span className="block text-[10px] font-semibold tabular-nums sm:text-[12px]">{range}</span>
                          <span
                            className={`mt-0.5 block text-[9px] font-normal leading-tight sm:text-[11px] ${
                              selected ? 'text-white/95' : 'text-neutral-600'
                            }`}
                          >
                            {quality}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">
                  We select participants where we can measure a meaningful change in focus and clarity.
                </p>
                {cognitiveQualityError && (
                  <p className="mt-2 text-sm text-red-600">Please select how you&apos;ve been feeling overall.</p>
                )}
              </div>

              <div className="mb-8">
                <div className="text-sm font-medium text-neutral-800">
                  What best describes your main issue?
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {COGNITIVE_ISSUE_OPTIONS.map((opt) => {
                    const selected = cognitiveIssue === opt
                    const deemph = opt === 'Generally sharp — no major issues'
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setCognitiveIssue(opt)
                          setCognitiveIssueError(false)
                        }}
                        className={`max-w-full rounded-full border px-4 py-2.5 text-left text-[13px] leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C84B2F] focus-visible:ring-offset-2 ${
                          deemph && !selected
                            ? 'border-dashed border-neutral-300 bg-neutral-50/70 text-neutral-500'
                            : !selected
                              ? 'border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400'
                              : 'border-transparent text-white shadow-sm'
                        }`}
                        style={selected ? { background: RUST, borderColor: 'transparent' } : undefined}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {cognitiveIssueError && (
                  <p className="mt-2 text-sm text-red-600">Please select the option that fits you best.</p>
                )}
              </div>
            </>
          )}

          <div className="mb-8">
            <div className="text-sm font-medium text-neutral-800">
              Are you currently taking {productLabel}?
            </div>
            <div className={pillOuterClass + ' mt-3'}>
              <button
                type="button"
                className={selectorButtonClass(currentProduct === 'no')}
                style={selectorButtonStyle(currentProduct === 'no')}
                onClick={() => {
                  setCurrentProduct('no')
                  setCurrentProductError(false)
                }}
              >
                No, I&apos;m not currently taking it
              </button>
              <button
                type="button"
                className={selectorButtonClass(currentProduct === 'yes')}
                style={selectorButtonStyle(currentProduct === 'yes')}
                onClick={() => {
                  setCurrentProduct('yes')
                  setCurrentProductError(false)
                }}
              >
                Yes, I&apos;m currently taking it
              </button>
            </div>
            {currentProductError && <p className="mt-2 text-sm text-red-600">Please answer this question to continue.</p>}
          </div>

          <div className="mb-8">
            <div className="text-sm font-medium text-neutral-800">
              {qualificationShape === 'sleep'
                ? 'Are you currently taking prescription medication for sleep?'
                : 'Are you currently taking prescription medication for sleep, attention, or anxiety where a dose change during the study would be unsafe or would confuse your baseline?'}
            </div>
            <div className={pillOuterClass + ' mt-3'}>
              <button
                type="button"
                className={selectorButtonClass(prescription === 'no')}
                style={selectorButtonStyle(prescription === 'no')}
                onClick={() => {
                  setPrescription('no')
                  setPrescError(false)
                }}
              >
                No
              </button>
              <button
                type="button"
                className={selectorButtonClass(prescription === 'yes')}
                style={selectorButtonStyle(prescription === 'yes')}
                onClick={() => {
                  setPrescription('yes')
                  setPrescError(false)
                }}
              >
                Yes — I would not be a fit for this study
              </button>
            </div>
            {prescError && <p className="mt-2 text-sm text-red-600">Please answer this question to continue.</p>}
          </div>

          <div className="mb-8">
            <label
              htmlFor="cohort-commitment"
              className="flex w-full cursor-pointer items-start gap-4 rounded-[8px] p-4 text-left text-[15px] font-medium leading-relaxed text-neutral-800 transition-colors focus-within:ring-2 focus-within:ring-[#C84B2F] focus-within:ring-offset-2"
              style={{
                border: `2px solid ${commitment ? RUST : BORDER_SUBTLE}`,
                background: commitment ? 'rgba(200,75,47,0.06)' : '#fff',
                padding: 18,
              }}
            >
              <input
                id="cohort-commitment"
                type="checkbox"
                className="mt-0.5 h-8 w-8 shrink-0 cursor-pointer rounded-md border-2 border-neutral-400 text-white"
                style={{ accentColor: RUST }}
                checked={commitment}
                onChange={(e) => setCommitment(e.target.checked)}
                required
              />
              <span>
                {qualificationShape === 'sleep' ? (
                  <>
                    I can commit to a 30-second check-in each morning for {days} days, starting with 2 check-ins in the next
                    48 hours.
                  </>
                ) : (
                  <>
                    I can commit to a 30-second check-in each day for {days} days, starting with 2 check-ins in the next 48
                    hours.
                  </>
                )}
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-[8px] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C84B2F] focus-visible:ring-offset-2"
            style={{ background: RUST }}
          >
            Submit application
          </button>
          <p className="mt-4 text-center text-[12px] leading-relaxed text-neutral-500 sm:text-left">
            Selected participants will be confirmed by email.
          </p>
        </form>
      </div>
    </section>
  )
}
