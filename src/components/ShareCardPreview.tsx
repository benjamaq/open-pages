'use client'

import { ShareInputs } from '../lib/sharing'

interface ShareCardPreviewProps {
  inputs: ShareInputs
}

export default function ShareCardPreview({ inputs }: ShareCardPreviewProps) {
  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  const energyColor = inputs.energy >= 8 ? 'text-emerald-600' : inputs.energy >= 5 ? 'text-amber-600' : 'text-rose-600'

  return (
    <div 
      id="share-preview-card"
      className="w-full max-w-[400px] mx-auto rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 space-y-4"
      style={{ aspectRatio: '1/1' }}
    >
      {/* Date */}
      <div className="text-sm text-zinc-500">{formatDate(new Date())}</div>

      {/* Human-first energy line */}
      <div className="text-2xl font-bold text-zinc-900">
        <span>Today I'm feeling </span>
        <span className={energyColor}>{inputs.vibe}</span>
        <span className={energyColor}> — {inputs.energy}/10</span>
      </div>

      {/* Optional note */}
      {inputs.note && (
        <div className="text-sm text-zinc-600 italic">"{inputs.note}"</div>
      )}

      {/* Wearables chip */}
      {(inputs.sleep != null || inputs.recovery != null) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
          <span className="font-medium">Oura</span>
          {inputs.sleep != null && <span>Sleep {inputs.sleep}</span>}
          {inputs.recovery != null && <span>Recovery {inputs.recovery}</span>}
        </div>
      )}

      {/* Categories */}
      <div className="space-y-2">
        {inputs.supplementsCount && inputs.supplementsCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-zinc-700">
              Supplements: {inputs.supplementsCount}
            </span>
          </div>
        )}
        
        {inputs.todayChips && inputs.todayChips.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-zinc-700">
              Today: {inputs.todayChips.slice(0, 3).join(' • ')}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm pt-4 border-t border-zinc-200">
        <a href={inputs.publicUrl} className="font-medium text-blue-600 hover:underline">
          View my full stack →
        </a>
        <span className="text-zinc-500">Powered by BioStackr.io</span>
      </div>
    </div>
  )
}
