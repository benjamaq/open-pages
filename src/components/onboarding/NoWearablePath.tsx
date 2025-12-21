'use client'

export function NoWearablePath({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-[#f8f7f4] border border-[#e7e5e0] p-5">
        <div className="space-y-1 text-slate-700">
          <div className="font-semibold text-slate-900">That’s fine.</div>
          <div>We’ll build signal from your daily check‑ins.</div>
          <div>You can upload data later if you want.</div>
        </div>
      </div>
      <div className="flex items-center justify-end">
        <button className="h-11 px-6 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}


