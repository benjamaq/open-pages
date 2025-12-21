import React from 'react';
import { Copy } from '@/lib/copy';
import { CockpitTokens } from '@/lib/colors';

type BaseState = 'TRIAL'|'GATHERING_EVIDENCE'|'RULE'
type Overlay = 'CONFOUNDED'|'HURTING'|null

export default function ConfidenceRing({
  n,
  confidence,
  size = 80,
  base,
  overlay,
  ariaLabel
}: {
  n: number
  confidence: number | null
  size?: number
  base: BaseState
  overlay?: Overlay
  ariaLabel?: string
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, confidence ?? 0));
  const dash = (pct / 100) * c;

  // Use solid stroke color based on base state (simpler and reliable)
  const strokeColor =
    base === 'TRIAL' ? CockpitTokens.trial.dot :
    base === 'RULE' ? CockpitTokens.rule.dot :
    CockpitTokens.gather.dot;
  
  const hurting = overlay === 'HURTING'
  const confounded = overlay === 'CONFOUNDED'

  return (
    <div
      className={`relative inline-flex items-center justify-center ${confounded ? 'animate-signal-glitch' : ''}`}
      title={Copy.ringTooltip}
      aria-label={ariaLabel ?? `Confidence ${confidence ?? 0}% over ${n} days`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="block -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2}
          cy={size/2}
          r={r}
          className={hurting ? 'stroke-rose-500' : ''}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          style={{ stroke: hurting ? undefined : strokeColor }}
        />
      </svg>
      <span className="absolute text-[13px] font-semibold text-gray-900">
        {confidence == null ? '—' : Math.round(confidence)}
        <span className="text-[10px] opacity-70">%</span>
      </span>
      <span className="absolute bottom-1 text-[10px] text-gray-500">{n}d</span>
    </div>
  );
}


