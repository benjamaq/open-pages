'use client';
import { useState } from 'react';

type Mood = 'low'|'ok'|'sharp';

const OPTIONS: {key: Mood; label: string; emoji: string}[] = [
  { key: 'low',   label: 'Low',   emoji: '😪' },
  { key: 'ok',    label: 'OK',    emoji: '🙂' },
  { key: 'sharp', label: 'Sharp', emoji: '⚡' },
];

export default function MoodPicker({ defaultValue, onSubmit }: {
  defaultValue?: Mood; onSubmit?: (m: Mood) => void;
}) {
  const [value, setValue] = useState<Mood | null>(defaultValue ?? null);
  const [loading, setLoading] = useState(false);

  async function handlePick(m: Mood) {
    console.log('💭 MOOD CLICKED:', m);
    if (loading) return;
    setValue(m);
    setLoading(true);
    try {
      console.log('📡 POST /api/checkins/quick');
      await fetch('/api/checkins/quick', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ mood: m, day: new Date().toISOString().slice(0,10) })
      });
      // fire cockpit refresh
      try { 
        console.log('✅ Check-in posted');
        window.dispatchEvent(new CustomEvent('bs_signals_updated')); 
      } catch {}
      onSubmit?.(m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-800">How’s today feel?</span>
        <span className="text-[11px] text-gray-500">1-tap keeps your signals honest</span>
      </div>

      <div role="radiogroup" aria-label="Daily check-in" className="grid grid-cols-3 gap-2">
        {OPTIONS.map(opt => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              role="radio"
              aria-checked={active}
              disabled={loading}
              onClick={() => handlePick(opt.key)}
              className={[
                'h-12 rounded-lg border transition-all focus:outline-none focus-visible:ring-2',
                active
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-emerald-200'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              ].join(' ')}
            >
              <div className="flex h-full items-center justify-center gap-2 text-sm font-medium">
                <span className="text-base">{opt.emoji}</span>
                <span>{opt.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


