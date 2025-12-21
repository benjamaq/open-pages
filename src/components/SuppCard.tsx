export interface SuppCardProps {
  name: string
  stage: 'hypothesis' | 'watching' | 'validating' | 'proven' | string
  confidencePercent?: number
  onClick?: () => void
  truthReportHref?: string
  newReport?: boolean
  progress?: { daysCompleted: number; targetDays: number }
  observation?: { text: string }
}

import { useState } from 'react'
import CommunityInline from './CommunityInline'
import CommunityModal from './CommunityModal'

export default function SuppCard({
  name,
  stage,
  confidencePercent,
  onClick,
  truthReportHref,
  newReport = false,
  progress,
  observation
}: SuppCardProps) {
  const [open, setOpen] = useState(false)
  const badge = stageBadge(stage)
  return (
    <div
      className={`rounded-2xl p-6 transition hover:-translate-y-[1px] ${stageTint(stage)}`}
      style={{
        border: '1px solid transparent',
        background:
          'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(180deg, rgba(2,6,23,0.08), rgba(255,255,255,0)) border-box',
        boxShadow: '0 1px 0 rgba(15,23,42,0.04)'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="text-sm font-semibold flex items-center gap-2" style={{ color: '#1F2937' }}>
          {name}
          {newReport && (
            <span className="relative text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 text-emerald-700 overflow-hidden">
              <span className="relative z-10">NEW REPORT</span>
              <span className="absolute inset-0 rounded-full opacity-70 shimmer" />
              <style jsx>{`
                @keyframes sheen {
                  0% { transform: translateX(-120%); }
                  100% { transform: translateX(120%); }
                }
                .shimmer {
                  background: linear-gradient(120deg, rgba(16,185,129,0) 0%, rgba(16,185,129,0.25) 30%, rgba(16,185,129,0) 60%);
                  animation: sheen 2200ms ease-in-out infinite;
                }
              `}</style>
            </span>
          )}
        </div>
        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs" style={{ color: '#6B7280' }}>
          <span className="font-medium" style={{ color: '#1F2937' }}>Confidence:</span> {Math.round((confidencePercent || 0))}%
        </div>
        <div className="flex items-center gap-2">
          <MiniRing percent={Math.round((confidencePercent || 0))} />
        </div>
      </div>
      <div className="text-xs mt-2" style={{ color: '#6B7280' }}>
        <span className="font-medium" style={{ color: '#1F2937' }}>Status:</span> {statusLine(badge.label)}
      </div>
      {/* Progress (if provided) */}
      {progress && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs" style={{ color: '#6B7280' }}>
            <span>Sample collection</span>
            <span className="font-medium" style={{ color: '#1F2937' }}>
              {progress.daysCompleted}/{progress.targetDays} days
            </span>
          </div>
          <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div
              className="absolute left-0 top-0 h-full bg-indigo-500 transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, Math.round((progress.daysCompleted / Math.max(1, progress.targetDays)) * 100)))}%`
              }}
            />
          </div>
        </div>
      )}
      {/* Early observation (if provided) */}
      {observation && (
        <div className="mt-3 rounded-lg bg-indigo-50 border border-indigo-200 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700 mb-1">
            Early observation (not significant)
          </div>
          <p className="text-xs text-slate-700">{observation.text}</p>
        </div>
      )}
      <CommunityInline text="67% of users report better sleep by Week 2." />
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClick} className="text-xs underline" style={{ color: '#6B7280' }}>View details</button>
          {truthReportHref && (
            <a href={truthReportHref} className="text-xs underline" style={{ color: '#1F2937' }}>View Truth Report</a>
          )}
        </div>
        <button className="text-sm underline" style={{ color: '#3B6EF6' }} onClick={() => setOpen(true)}>View community data</button>
      </div>
      <CommunityModal supplementId={name} name={name} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function stageLabel(s: string) {
  if (s.includes('hypo')) return 'Hypothesis'
  if (s.includes('watch')) return 'Watching'
  if (s.includes('valid')) return 'Validating'
  if (s.includes('proven')) return 'Proven'
  return s
}

function statusLine(s: string) {
  const t = s.toLowerCase()
  if (t.includes('hypo')) return 'Baseline collection in progress.'
  if (t.includes('watch')) return 'Monitoring early signals; more clean days required.'
  if (t.includes('valid')) return 'Validation phase: testing if the effect holds.'
  if (t.includes('proven')) return 'Analysis consistent with a beneficial effect.'
  return 'In evaluation.'
}

function stageBadge(s: string) {
  const k = (s || '').toLowerCase()
  if (k.includes('hypo')) return { label: 'HYPOTHESIS', className: 'border border-slate-400 text-slate-700' }
  if (k.includes('watch')) return { label: 'WATCHING', className: 'border border-amber-500 text-amber-700' }
  if (k.includes('valid')) return { label: 'VALIDATING', className: 'border border-blue-500 text-blue-700' }
  if (k.includes('proven')) return { label: 'PROVEN', className: 'border border-emerald-500 text-emerald-700' }
  return { label: stageLabel(s).toUpperCase(), className: 'border border-slate-400 text-slate-700' }
}

function stageTint(s: string) {
  const k = (s || '').toLowerCase()
  if (k.includes('negative')) return 'border-rose-200'
  if (k.includes('no_effect')) return 'border-amber-200'
  return 'border-slate-200'
}

function MiniRing({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent))
  const r = 10
  const c = 2 * Math.PI * r
  const off = c - (p / 100) * c
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(15,23,42,0.1)" strokeWidth="3" />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke="#3B6EF6"
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 14 14)"
      />
    </svg>
  )
}


