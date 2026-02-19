'use client'

export default function ContinueWithoutUpload({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-slate-500">You can upload data anytime later.</div>
      <button
        className="min-h-11 h-auto w-full sm:w-auto px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold leading-tight text-center hover:bg-slate-800"
        onClick={onContinue}
      >
        Continue without uploading
      </button>
    </div>
  )
}


