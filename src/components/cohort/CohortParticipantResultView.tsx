'use client'

import { useRef, useState } from 'react'

export type CohortParticipantResultPayload = {
  result_json: Record<string, unknown> | null
  result_version: number
  published_at: string
  product_name: string | null
  brand_name: string | null
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

/**
 * Participant-only cohort result layout + PDF export (not TruthReportView).
 * `result_json` shape: { verdict, bullet_points[], explanation } (+ legacy keys supported).
 */
export default function CohortParticipantResultView({
  payload,
}: {
  payload: CohortParticipantResultPayload
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const j = normalizeResultRecord(payload.result_json)
  const { verdictHeadline, bulletPoints, explanation, hasStructuredContent } = parseResultSections(
    j,
    payload.product_name,
  )

  const partnerLine = [payload.brand_name, 'BioStackr'].filter(Boolean).join(' × ')
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
        >
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>

      <div
        ref={rootRef}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-slate-900"
      >
        {partnerLine ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{partnerLine}</p>
        ) : null}
        {publishedLabel ? (
          <p className="mt-2 text-sm text-slate-600">Published {publishedLabel}</p>
        ) : null}
        <p className="mt-1 text-xs text-slate-500">Personal summary · v{payload.result_version}</p>

        {hasStructuredContent ? (
          <>
            <header className="mt-8 border-t border-slate-100 pt-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#C84B2F]">Verdict</p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                {verdictHeadline}
              </h1>
            </header>

            {bulletPoints.length > 0 ? (
              <section className="mt-10">
                <h2 className="text-base font-semibold text-slate-900">What changed</h2>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-slate-800">
                  {bulletPoints.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {explanation ? (
              <section className="mt-10">
                <h2 className="text-base font-semibold text-slate-900">What this means</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-slate-800 whitespace-pre-line">
                  {explanation}
                </p>
              </section>
            ) : null}
          </>
        ) : (
          <p className="mt-8 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-8">
            Your personal outcome summary will appear here once it includes a <strong>verdict</strong> (clear headline),{' '}
            <strong>bullet_points</strong> (what changed in your check-ins), and an <strong>explanation</strong> (what
            that means for you in plain English).
          </p>
        )}
      </div>
    </div>
  )
}
