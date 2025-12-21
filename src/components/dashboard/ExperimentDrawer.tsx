'use client'

import { AnimatePresence, motion } from 'framer-motion'

export default function ExperimentDrawer({
  open,
  onClose,
  experiment,
  onPause,
  onEnd
}: {
  open: boolean
  onClose: () => void
  experiment: any | null
  onPause: (id: string) => Promise<void>
  onEnd: (id: string) => Promise<void>
}) {
  if (!open || !experiment) return null
  const day = Math.max(1, Math.ceil((Date.now() - new Date(experiment.start_date).getTime()) / 86400000))
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <AnimatePresence initial={false}>
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl p-6"
          role="dialog"
          aria-label="Experiment details"
        >
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{experiment.name || '7-day test'}</h3>
            <button onClick={onClose} className="rounded-lg px-3 py-1.5 hover:bg-neutral-100">
              Close
            </button>
          </header>
          <div className="mt-4 text-sm text-neutral-600">
            Day {day}/{experiment.target_days}
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div>
              Δ {experiment.effect_pct != null ? (experiment.effect_pct > 0 ? '+' : '') + experiment.effect_pct + '%' : '—'}
              {' · '}Conf {experiment.confidence ?? '—'}%
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <button onClick={() => onPause(experiment.id)} className="rounded-xl border px-3 py-2 hover:bg-neutral-50">
              Pause
            </button>
            <button onClick={() => onEnd(experiment.id)} className="rounded-xl bg-neutral-900 text-white px-3 py-2 hover:bg-neutral-800">
              End & get verdict
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>
    </div>
  )
}


