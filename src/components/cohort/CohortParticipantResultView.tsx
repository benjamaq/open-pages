'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { cohortProProductEntryPath } from '@/lib/cohortDashboardDeepLink'

export type CohortParticipantResultPayload = {
  result_json: Record<string, unknown> | null
  result_version: number
  published_at: string
  product_name: string | null
  brand_name: string | null
}

export type CohortParticipantResultRewards = {
  pro_claimed: boolean
  pro_claim_token: string | null
  pro_has_claim_row: boolean
}

function stringField(j: Record<string, unknown>, key: string): string | null {
  const v = j[key]
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t !== '' ? t : null
}

function stringListField(j: Record<string, unknown>, key: string): string[] {
  const v = j[key]
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((s) => s.trim())
}

function normalizeResultRecord(raw: Record<string, unknown> | null | unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown
      if (p && typeof p === 'object' && !Array.isArray(p)) {
        return p as Record<string, unknown>
      }
    } catch {
      /* ignore */
    }
  }
  return {}
}

/** Prefer new keys; fall back to older result_json shapes. */
function parseResultSections(
  j: Record<string, unknown>,
  productName: string | null,
): {
  verdictHeadline: string
  bulletPoints: string[]
  explanation: string | null
  /** True when payload had at least one substantive field (not just fallbacks). */
  hasStructuredContent: boolean
} {
  const verdictRaw = stringField(j, 'verdict') || stringField(j, 'title')

  const bulletPoints = (() => {
    const next = stringListField(j, 'bullet_points')
    if (next.length) return next
    const hi = stringListField(j, 'highlights')
    if (hi.length) return hi
    return stringListField(j, 'bullets')
  })()

  const explanation =
    stringField(j, 'explanation') ||
    stringField(j, 'summary') ||
    stringField(j, 'overview') ||
    null

  const hasStructuredContent = Boolean(
    verdictRaw ||
      stringListField(j, 'bullet_points').length > 0 ||
      stringField(j, 'explanation') ||
      stringField(j, 'summary') ||
      stringField(j, 'overview') ||
      stringListField(j, 'highlights').length > 0 ||
      stringListField(j, 'bullets').length > 0,
  )

  const verdictHeadline =
    verdictRaw ||
    (productName ? `Your ${productName} study — personal outcome` : 'Your personal study outcome')

  return {
    verdictHeadline,
    bulletPoints,
    explanation,
    hasStructuredContent,
  }
}

function studyContextLine(brandName: string | null, productName: string | null): string {
  const b = typeof brandName === 'string' ? brandName.trim() : ''
  const p = typeof productName === 'string' ? productName.trim() : ''
  if (b && p) return `${b} ${p} study`
  if (p) return `${p} study`
  if (b) return `${b} study`
  return 'Study results'
}

/**
 * Participant-only cohort result layout + PDF export (not TruthReportView).
 * `result_json` shape: { verdict, bullet_points[], explanation } (+ legacy keys supported).
 */
export default function CohortParticipantResultView({
  payload,
  rewards,
}: {
  payload: CohortParticipantResultPayload
  rewards?: CohortParticipantResultRewards | null
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [claimBusy, setClaimBusy] = useState(false)
  const [claimErr, setClaimErr] = useState<string | null>(null)
  const [claimedOnPage, setClaimedOnPage] = useState(false)
  const j = normalizeResultRecord(payload.result_json)
  const { verdictHeadline, bulletPoints, explanation, hasStructuredContent } = parseResultSections(
    j,
    payload.product_name,
  )

  const studyLine = studyContextLine(payload.brand_name, payload.product_name)
  const publishedLabel = (() => {
    try {
      const d = new Date(payload.published_at)
      if (!Number.isFinite(d.getTime())) return null
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return null
    }
  })()

  async function handleDownloadPdf() {
    if (!rootRef.current) {
      alert('Could not find content to export.')
      return
    }
    try {
      setDownloading(true)
      const html2pdf = (await import('html2pdf.js')).default as (opts?: unknown) => {
        set: (o: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } }
      }
      const safe = (payload.product_name || 'cohort-result')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const opt = {
        margin: [12, 12, 12, 12],
        filename: `${safe || 'cohort-result'}-summary.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }
      const wrapper = document.createElement('div')
      wrapper.style.background = '#ffffff'
      wrapper.style.padding = '0'
      wrapper.style.color = '#111827'
      wrapper.appendChild(rootRef.current.cloneNode(true) as HTMLElement)
      await html2pdf().set(opt).from(wrapper).save()
    } catch (e) {
      console.error('cohort result pdf', e)
      alert('PDF export failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const proClaimed = Boolean(rewards?.pro_claimed || claimedOnPage)

  async function claimProOnThisAccount() {
    const token = rewards?.pro_claim_token?.trim()
    if (!token) return
    setClaimErr(null)
    setClaimBusy(true)
    try {
      const res = await fetch('/api/cohort/claim-reward', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const j = (await res.json().catch(() => ({}))) as {
        error?: string
        ok?: boolean
        already_claimed?: boolean
      }
      if (!res.ok) {
        setClaimErr(String(j.error || 'Could not activate Pro'))
        return
      }
      if (j.ok || j.already_claimed) {
        setClaimedOnPage(true)
        try {
          window.dispatchEvent(new Event('dashboard:refresh'))
        } catch {
          /* ignore */
        }
      }
    } catch {
      setClaimErr('Something went wrong.')
    } finally {
      setClaimBusy(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="shrink-0 rounded-2xl border border-slate-200/95 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <img
              src="/DNA-logo-black.png"
              alt="DoNotAge"
              className="h-6 sm:h-8 w-auto max-w-[108px] sm:max-w-[124px] object-contain object-left"
            />
          </div>
          <div className="h-8 w-px shrink-0 bg-slate-200/80 hidden sm:block" aria-hidden />
          <div className="min-w-0">
            <h1 className="text-[1.625rem] sm:text-3xl font-bold text-slate-950 tracking-[-0.02em] leading-[1.12]">
              Your results
            </h1>
            <p className="mt-1 text-sm sm:text-[0.9375rem] text-slate-600 font-medium tracking-tight">{studyLine}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="shrink-0 self-start sm:self-center rounded-xl border border-slate-200/95 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-white disabled:opacity-50 backdrop-blur-sm"
        >
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>

      <div
        ref={rootRef}
        className="rounded-3xl border border-slate-200 bg-white px-5 py-7 sm:px-10 sm:py-10 text-slate-900 shadow-[0_12px_48px_-20px_rgba(15,23,42,0.22),0_4px_14px_-6px_rgba(15,23,42,0.08)]"
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs sm:text-sm text-slate-500 font-medium">
          {publishedLabel ? <span className="tabular-nums">Published {publishedLabel}</span> : null}
          {publishedLabel ? <span className="text-slate-300 select-none" aria-hidden>·</span> : null}
          <span>Summary v{payload.result_version}</span>
        </div>

        {hasStructuredContent ? (
          <>
            <header className="mt-6 sm:mt-7">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C84B2F]">
                Your verdict
              </p>
              <h2 className="mt-3 sm:mt-4 text-[1.75rem] sm:text-[2.125rem] font-bold text-slate-950 leading-[1.14] tracking-[-0.02em]">
                {verdictHeadline}
              </h2>
            </header>

            {bulletPoints.length > 0 ? (
              <section className="mt-9 sm:mt-11">
                <h3 className="text-base sm:text-lg font-semibold text-slate-950 tracking-tight">What changed</h3>
                <ul className="mt-4 sm:mt-5 list-disc space-y-3 pl-5 text-[15px] sm:text-[1.0625rem] leading-[1.6] text-slate-800 marker:text-[#C84B2F]">
                  {bulletPoints.map((line) => (
                    <li key={line} className="pl-0.5">
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {explanation ? (
              <section className="mt-9 sm:mt-11">
                <h3 className="text-base sm:text-lg font-semibold text-slate-950 tracking-tight">What this means</h3>
                <p className="mt-4 sm:mt-5 text-[15px] sm:text-[1.0625rem] leading-[1.65] text-slate-800 whitespace-pre-line">
                  {explanation}
                </p>
              </section>
            ) : null}
          </>
        ) : (
          <p className="mt-6 text-sm leading-relaxed text-slate-600">
            Your personal outcome summary will appear here once it includes a <strong>verdict</strong> (clear headline),{' '}
            <strong>bullet_points</strong> (what changed in your check-ins), and an <strong>explanation</strong> (what
            that means for you in plain English).
          </p>
        )}
      </div>

      {rewards ? (
        <section className="mt-8 sm:mt-10 space-y-4 sm:space-y-5" aria-label="Your rewards">
          <article className="rounded-2xl border border-stone-200/95 bg-gradient-to-b from-[#faf8f5] via-white to-white px-7 py-8 sm:px-9 sm:py-9 shadow-[0_6px_28px_-12px_rgba(28,25,23,0.12)]">
            <div className="flex items-center min-h-[2.35rem]">
              <img
                src="/DNA-logo-black.png"
                alt="DoNotAge"
                className="h-[1.85rem] sm:h-10 w-auto max-w-[148px] object-contain object-left"
              />
            </div>
            <h2 className="mt-6 sm:mt-7 text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              Your DoNotAge reward
            </h2>
            <p className="mt-3 sm:mt-4 max-w-prose text-[15px] sm:text-[1.0625rem] leading-relaxed text-slate-800">
              Your 3-month supply of SureSleep will be shipped automatically to the address you provided during signup.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/70 px-7 py-8 sm:px-9 sm:py-9 shadow-[0_8px_36px_-14px_rgba(15,23,42,0.16)] border-l-[4px] border-l-[#C84B2F]">
            <div className="flex items-center min-h-[2.35rem]">
              <img
                src="/brand/biostackr-logo.png"
                alt="BioStackr"
                className="h-8 sm:h-9 w-auto max-w-[132px] object-contain object-left"
              />
            </div>
            <h2 className="mt-6 sm:mt-7 text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              Your BioStackr reward
            </h2>

            {proClaimed ? (
              <div className="mt-5 space-y-4">
                <div className="space-y-3 text-[15px] sm:text-[1.0625rem] leading-relaxed text-slate-800">
                  <p>Your BioStackr Pro is now active.</p>
                  <p>Start building your stack and see what actually works for you.</p>
                </div>
                <Link
                  href={cohortProProductEntryPath()}
                  className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-[#C84B2F] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-95"
                >
                  Go to your stack
                </Link>
              </div>
            ) : rewards.pro_claim_token ? (
              <>
                <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-slate-800">
                  You&apos;ve unlocked 3 months of BioStackr Pro.
                </p>
                <button
                  type="button"
                  disabled={claimBusy}
                  onClick={() => void claimProOnThisAccount()}
                  className="mt-5 inline-flex justify-center rounded-xl bg-[#1e293b] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                >
                  {claimBusy ? 'Activating…' : 'Claim your Pro access'}
                </button>
                {claimErr ? <p className="mt-3 text-sm text-red-600">{claimErr}</p> : null}
              </>
            ) : (
              <p className="mt-5 text-sm text-slate-600">
                Your reward details will appear here when they are ready. Try refreshing the page, or contact support if
                this continues.
              </p>
            )}
          </article>
        </section>
      ) : null}
    </div>
  )
}
