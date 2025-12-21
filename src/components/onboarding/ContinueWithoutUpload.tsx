'use client'

export default function ContinueWithoutUpload({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex items-center justify-between mt-8">
      <div className="text-xs text-slate-500">You can upload data anytime later.</div>
      <button className="h-11 px-6 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800" onClick={onContinue}>
        Continue without uploading
      </button>
    </div>
  )
}


