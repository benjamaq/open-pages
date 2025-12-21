'use client'

import { useEffect, useRef, useState } from 'react'
import TimelineCanvas from '@/components/timeline/TimelineCanvas'

type Period = {
  id: string
  start: string
  end: string | null
  note?: string | null
}

type Signal = {
  n: number
  effectPct: number | null
  confidence: number | null
  status?: 'insufficient' | 'testing' | 'confirmed' | 'hurting' | 'no_effect'
}

type Supplement = {
  id: string
  name: string
  dose?: string | null
  monthlyCost?: number | null
  periods: Period[]
  signal?: Signal
}

type Props = {
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  supplement?: Supplement
  supplementId?: string
  supplementName?: string
  onSaveInfo?: (payload: Partial<Supplement> & { id: string }) => Promise<void> | void
  onCreatePeriod?: (sid: string, p: Omit<Period,'id'>) => Promise<void> | void
  onUpdatePeriod?: (sid: string, p: Period) => Promise<void> | void
  onDeletePeriod?: (sid: string, periodId: string) => Promise<void> | void
}

export default function SupplementDetailsModal({
  open,
  isOpen,
  onClose,
  supplement,
  supplementId,
  supplementName,
  onSaveInfo,
  onCreatePeriod,
  onUpdatePeriod,
  onDeletePeriod
}: Props) {
  const [tab, setTab] = useState<'timeline'|'info'>('timeline')
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    const visible = typeof isOpen === 'boolean' ? isOpen : !!open
    if (visible) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, isOpen, onClose])

  const visible = typeof isOpen === 'boolean' ? isOpen : !!open
  if (!visible) return null

  const sup: Supplement = supplement ?? {
    id: supplementId || 'unknown',
    name: supplementName || 'Supplement',
    periods: [],
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" role="dialog" aria-modal="true" aria-label={`${sup.name} details`}>
      <div ref={dialogRef} className="w-[92vw] max-w-5xl rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{sup.name}</h2>
            {typeof sup.signal?.confidence === 'number' && (
              <span className="text-xs text-gray-500">n={sup.signal?.n ?? 0} · {sup.signal?.effectPct != null ? `${sup.signal?.effectPct! >= 0 ? '+' : ''}${Math.round(sup.signal?.effectPct!)}%` : '—'} · Conf {Math.round(sup.signal?.confidence ?? 0)}%</span>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100">Close</button>
        </header>

        <nav className="px-6 pt-3">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button onClick={()=>setTab('timeline')} className={`px-4 py-2 text-sm rounded-lg ${tab==='timeline'?'bg-white shadow':'text-gray-600'}`}>Timeline</button>
            <button onClick={()=>setTab('info')} className={`px-4 py-2 text-sm rounded-lg ${tab==='info'?'bg-white shadow':'text-gray-600'}`}>Info</button>
          </div>
        </nav>

        <div className="max-h-[70vh] overflow-auto">
          {tab === 'timeline' ? (
            <section className="p-6">
              <TimelineCanvas
                supplementId={sup.id}
                periods={sup.periods}
                onCreatePeriod={onCreatePeriod}
                onUpdatePeriod={onUpdatePeriod}
                onDeletePeriod={onDeletePeriod}
              />
            </section>
          ) : (
            <section className="p-6 grid gap-4">
              <div className="grid gap-1">
                <label className="text-sm text-gray-600">Name</label>
                <input
                  defaultValue={sup.name}
                  className="rounded-xl border px-3 py-2"
                  onBlur={async (e)=> onSaveInfo?.({ id: sup.id, name: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm text-gray-600">Dose (optional)</label>
                <input
                  defaultValue={sup.dose ?? ''}
                  className="rounded-xl border px-3 py-2"
                  onBlur={async (e)=> onSaveInfo?.({ id: sup.id, dose: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm text-gray-600">Monthly cost (optional)</label>
                <input
                  type="number"
                  step="1"
                  defaultValue={sup.monthlyCost ?? ''}
                  className="rounded-xl border px-3 py-2 w-40"
                  onBlur={async (e)=> onSaveInfo?.({ id: sup.id, monthlyCost: Number(e.target.value || 0) })}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}


