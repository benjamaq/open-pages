import { effectColor, formatPct } from '@/lib/signals';

export default function EffectBadge({ effectPct, label }: { effectPct: number | null; label?: string }) {
  const mode = effectColor(effectPct);
  const cls = mode === 'pos'
    ? 'text-emerald-700 bg-emerald-50 ring-emerald-200'
    : mode === 'neg'
    ? 'text-red-700 bg-red-50 ring-red-200'
    : 'text-gray-600 bg-gray-50 ring-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ring-1 ${cls}`}>
      <span>{formatPct(effectPct)}</span>
      {label ? <span className="opacity-70">{label}</span> : null}
    </span>
  );
}


