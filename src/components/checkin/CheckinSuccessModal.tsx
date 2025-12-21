'use client'

import type { UserContext } from '@/lib/types'

export function CheckinSuccessModal({ context, onClose, noiseTags }: { context: UserContext; onClose: () => void; noiseTags?: string[] }) {
  const deltas = {
    mood: context.today?.mood != null && context.yesterday?.mood != null ? (context.today.mood - (context.yesterday.mood as number)) : null,
    energy: context.today?.energy != null && context.yesterday?.energy != null ? (context.today.energy - (context.yesterday.energy as number)) : null,
    focus: context.today?.focus != null && context.yesterday?.focus != null ? (context.today.focus - (context.yesterday.focus as number)) : null
  }
  const top = Object.entries(deltas)
    .filter(([, d]) => typeof d === 'number' && (d as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0]

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-lg p-6">
          <div className="text-center space-y-3">
            <div className="text-2xl">✨</div>
            <h2 className="text-xl font-semibold text-slate-900">Check-in complete!</h2>
            <div className="text-xs font-semibold uppercase text-slate-500">Today’s snapshot</div>
            <div className="space-y-2 text-left bg-slate-50 rounded-lg p-4">
              {context.today?.mood != null && (
                <Row label="😊 Mood" value={context.today.mood} delta={deltas.mood} highlight={top === 'mood'} />
              )}
              {context.today?.energy != null && (
                <Row label="⚡ Energy" value={context.today.energy} delta={deltas.energy} highlight={top === 'energy'} />
              )}
              {context.today?.focus != null && (
                <Row label="🎯 Focus" value={context.today.focus} delta={deltas.focus} highlight={top === 'focus'} />
              )}
            </div>
            {(() => { try { console.log('Noise factors:', noiseTags) } catch {} return null })()}
            {noiseTags && noiseTags.length > 0 && (
              <div className="text-left bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">We noticed</div>
                {noiseTags.slice(0, 2).map((t, i) => {
                  const msg = NOISE_MESSAGES[t as keyof typeof NOISE_MESSAGES];
                  if (!msg) return null;
                  return (
                    <div key={t + i} className="flex items-start gap-2 text-sm text-amber-800 mb-1.5">
                      <span className="text-base leading-none">{msg.icon}</span>
                      <div>
                        <div className="font-medium">{msg.title}</div>
                        <div className="text-amber-700 text-xs">{msg.text}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-sm text-slate-600">
              That’s <span className="font-semibold">{context.daysTracked}</span> day{context.daysTracked !== 1 ? 's' : ''} tracked. You’re building your truth.
            </p>
            <button onClick={onClose} className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">See your progress →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, delta, highlight }: { label: string; value: number; delta: number | null; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="font-semibold text-slate-900">
        {value}/5
        {delta !== null && (
          <span className={delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-slate-500'}>
            {' '}({delta > 0 ? '+' : ''}{delta})
          </span>
        )}
        {highlight && <span className="text-xs text-green-600 ml-2">⬆ Big improvement</span>}
      </span>
    </div>
  )
}

const NOISE_MESSAGES = {
  alcohol: {
    icon: '🍷',
    title: 'Alcohol logged',
    text: "We'll treat alcohol as a confounder so it doesn’t distort your signal.",
  },
  travel: {
    icon: '✈️',
    title: 'Travel / timezone change',
    text: 'Travel can disrupt sleep and recovery — we’ll adjust for it.',
  },
  illness: {
    icon: '🤒',
    title: 'Feeling sick',
    text: "Illness affects recovery and sleep. We'll factor this into your analysis.",
  },
  high_stress: {
    icon: '😰',
    title: 'High stress day',
    text: 'Stress drives HRV and sleep variability — we’ll filter this noise.',
  },
  poor_sleep: {
    icon: '😴',
    title: 'Very poor sleep',
    text: "Low sleep (<5h) weakens signal quality. We'll discount today in calculations.",
  },
  intense_exercise: {
    icon: '🏋️',
    title: 'Intense exercise logged',
    text: "Heavy training affects HRV and recovery. We'll factor this into your analysis.",
  },
  new_supplement: {
    icon: '🆕',
    title: 'New supplement started',
    text: "This may create confounding effects. We'll need extra data to isolate impacts.",
  },
} as const


