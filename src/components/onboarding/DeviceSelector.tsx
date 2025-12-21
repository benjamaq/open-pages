'use client'
import { WearableDevice } from '@/types/WearableDevice'

const GROUP_APPLE: Array<{ key: WearableDevice; label: string }> = [
  { key: WearableDevice.APPLE_HEALTH, label: 'Apple Health' },
  { key: WearableDevice.BEVEL, label: 'Bevel' },
  { key: WearableDevice.ATHLYTIC, label: 'Athlytic' },
  { key: WearableDevice.LIVITY, label: 'Livity' },
]

const GROUP_DIRECT: Array<{ key: WearableDevice; label: string }> = [
  { key: WearableDevice.WHOOP, label: 'WHOOP' },
  { key: WearableDevice.OURA, label: 'Oura' },
  { key: WearableDevice.GARMIN, label: 'Garmin' },
  { key: WearableDevice.FITBIT, label: 'Fitbit' },
  { key: WearableDevice.OTHER, label: 'Other app' },
  { key: WearableDevice.NOT_SURE, label: "I'm not sure" },
]

export function DeviceSelector({ selected, onSelect }: { selected: WearableDevice | null; onSelect: (d: WearableDevice) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-800">Where is your data from?</div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Apple Health & connected apps</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GROUP_APPLE.map(d => {
            const active = selected === d.key
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => onSelect(d.key)}
                className={[
                  'h-11 rounded-lg border text-sm font-medium',
                  active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                ].join(' ')}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Direct wearable exports</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GROUP_DIRECT.map(d => {
            const active = selected === d.key
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => onSelect(d.key)}
                className={[
                  'h-11 rounded-lg border text-sm font-medium',
                  active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                ].join(' ')}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


