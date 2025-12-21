import React from 'react';
import { statusFromSignal } from '@/lib/signals';
import { statusColor } from '@/lib/colors';
import { VerdictCopy } from '@/lib/copy';

type Props = {
  n: number;
  effectPct: number | null;
  confidence: number | null;
  variant?: 'short' | 'long' | 'dot';
  size?: 'sm' | 'md';
  titleOverride?: string;
  className?: string;
};

export default function VerdictBadge({
  n, effectPct, confidence, variant = 'short', size = 'sm', titleOverride, className
}: Props) {
  const status = statusFromSignal(n, effectPct, confidence);
  const color = statusColor(status);
  const text = variant === 'long' ? VerdictCopy.long[status] : VerdictCopy.short[status];
  const title = titleOverride ?? VerdictCopy.tooltip[status];

  if (variant === 'dot') {
    return (
      <span
        title={title}
        className={`inline-block rounded-full`}
        aria-label={text}
        style={{
          width: size === 'md' ? 10 : 8,
          height: size === 'md' ? 10 : 8,
          backgroundColor: color
        }}
      />
    );
  }

  const bg = withAlpha(color, 0.12);
  const ring = withAlpha(color, 0.35);
  const txt = color;

  return (
    <span
      title={title}
      className={[
        'inline-flex items-center gap-1 rounded-full px-2',
        size === 'md' ? 'h-7 text-xs' : 'h-6 text-[11px]',
        'font-medium ring-1',
        className ?? ''
      ].join(' ')}
      style={{ backgroundColor: bg, color: txt, borderColor: ring }}
      aria-label={`Verdict: ${text}`}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, backgroundColor: color }}
        aria-hidden
      />
      <span>{text}</span>
    </span>
  );
}

function withAlpha(hex: string, alpha: number) {
  const c = hex.replace('#','');
  const r = parseInt(c.slice(0,2),16);
  const g = parseInt(c.slice(2,4),16);
  const b = parseInt(c.slice(4,6),16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


