'use client'

import { FC } from 'react'
import { SupplementCardData, getMicroStatus, getProgressCopy } from '@/lib/supplements/types'

interface Props {
  data: SupplementCardData
  onClick?: () => void
  href?: string
}

export const SupplementCard: FC<Props> = ({ data, onClick, href }) => {
  const { dayLabel, helper } = getProgressCopy(
    data.daysTrackedLastWindow,
    data.daysRequiredForInsight
  )
  const microStatus = getMicroStatus(data)
  const showEarlySignalChip =
    data.insightState === 'early_signal' && data.effectDirection === 'positive'

  const Container: any = href ? 'a' : 'button'
  const containerProps: any = href
    ? { href }
    : { type: 'button', onClick }

  return (
    <Container
      {...containerProps}
      className="w-full text-left rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">{data.name}</span>
          {data.doseDisplay ? (
            <span className="text-xs text-slate-500">{data.doseDisplay}</span>
          ) : null}
        </div>
        {showEarlySignalChip && (
          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            Early signal ↑ {data.effectDimension ?? ''}
          </span>
        )}
      </div>

      {Array.isArray(data.purposes) && data.purposes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.purposes.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {(data.timeOfDayLabel || data.frequencyLabel || data.contextLabel) && (
        <div className="text-[11px] text-slate-500">
          {data.timeOfDayLabel ?? ''}{data.timeOfDayLabel && data.frequencyLabel ? ' • ' : ''}
          {data.frequencyLabel ?? ''}{(data.timeOfDayLabel || data.frequencyLabel) && data.contextLabel ? ' • ' : ''}
          {data.contextLabel ?? ''}
        </div>
      )}

      <div className="mt-1 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{dayLabel}</span>
          <span>{helper}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900"
            style={{
              width: `${Math.min(
                100,
                (Math.max(0, data.daysTrackedLastWindow ?? 0) /
                  (data.daysRequiredForInsight || 1)) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      {microStatus && <div className="mt-1 text-[11px] text-slate-600">{microStatus}</div>}

      {!data.isMember && data.hasTruthReport && (
        <div className="mt-2 rounded-md bg-slate-50 px-2 py-1 text-[10px] text-slate-500 flex items-center gap-1">
          <span>🔒</span>
          <span>Deeper trend analysis and confidence scores require Membership.</span>
        </div>
      )}
    </Container>
  )
}
