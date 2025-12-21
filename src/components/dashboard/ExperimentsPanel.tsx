'use client'

import VerdictBadge from '@/components/ui/VerdictBadge'
import EffectBadge from '@/components/ui/EffectBadge'

type ActiveTest = {
  id: string
  name: string
  day: number
  n: number
  effectPct: number
  confidence: number
}

export default function ExperimentsPanel({
  active,
  onStart,
  onPause,
  onEnd
}: {
  active?: ActiveTest | null
  onStart: () => void
  onPause: (id: string) => void
  onEnd: (id: string) => void
}) {
  return (
    <div data-testid="exp-panel">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        {!active ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">No active test</span>
            </div>
            <p className="text-sm text-neutral-600">
              Run a 7-day protocol to get a real verdict.
            </p>
            <ul className="list-disc pl-5 text-sm text-neutral-600 space-y-1">
              <li>I’ll tell you to <b>Keep / Drop / Needs more data</b> with confidence.</li>
              <li>You’ll see the dial move each day you check in.</li>
            </ul>
            <button
              onClick={onStart}
              className="mt-1 inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
            >
              Start a 7-day test
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Active test</div>
                <div className="text-sm text-neutral-600">{active.name}</div>
              </div>
              <VerdictBadge n={active.n} effectPct={active.effectPct} confidence={active.confidence} variant="dot" size="md" />
            </div>

            <div className="flex items-center gap-3 text-sm text-neutral-700">
              <span>Day {active.day}/7</span>
              <span>• n={active.n}</span>
              <span>• <EffectBadge effectPct={active.effectPct} label="delta" /></span>
              <span>• Conf {active.confidence}%</span>
            </div>

            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${(active.day / 7) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPause(active.id)}
                className="px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50"
              >
                Pause
              </button>
              <button
                onClick={() => onEnd(active.id)}
                className="px-3 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
              >
                End & get verdict
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


