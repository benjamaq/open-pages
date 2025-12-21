'use client'
import SupplementLogUploader from '@/components/upload/SupplementLogUploader'

export default function SupplementHistorySection() {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-slate-900">Past supplement history (optional)</div>
      <p className="text-sm text-slate-700">
        If you’ve previously logged when you started or stopped supplements, uploading that history helps us align changes with outcomes.
      </p>
      <p className="text-xs text-slate-500">You do not need this to get results.</p>
      <SupplementLogUploader onUploadComplete={() => { /* no-op */ }} />
    </div>
  )
}


