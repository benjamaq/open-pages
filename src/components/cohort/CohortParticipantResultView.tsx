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

/**
 * Participant-only cohort result layout + PDF export (not TruthReportView).
 */
export default function CohortParticipantResultView({
  payload,
}: {
  payload: CohortParticipantResultPayload
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const j = payload.result_json && typeof payload.result_json === 'object' ? payload.result_json : {}
  const title =
    stringField(j, 'title') ||
    (payload.product_name ? `Your ${payload.product_name} study summary` : 'Your study summary')
  const summary = stringField(j, 'summary') || stringField(j, 'overview')
  const highlights = stringListField(j, 'highlights').length
    ? stringListField(j, 'highlights')
    : stringListField(j, 'bullets')

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
        <h1 className="mt-2 text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
        {publishedLabel ? (
          <p className="mt-2 text-sm text-slate-600">Published {publishedLabel}</p>
        ) : null}
        <p className="mt-1 text-xs text-slate-500">Summary v{payload.result_version}</p>

        {summary ? <p className="mt-6 text-base leading-relaxed text-slate-800">{summary}</p> : null}

        {highlights.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-900">Highlights</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-800">
              {highlights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {!summary && highlights.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">
            Additional detail will appear here once your result payload includes a written summary or bullet points.
          </p>
        ) : null}
      </div>
    </div>
  )
}
