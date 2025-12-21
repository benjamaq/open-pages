'use client'
import { useState } from 'react'

export default function SupplementLogUploader({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [drag, setDrag] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])

  async function handleSelected(list: File[]) {
    setError(null)
    setFiles(list)
    if (list.length === 0) return
    setIsUploading(true)
    try {
      for (const f of list) {
        const form = new FormData()
        form.append('file', f)
        const res = await fetch('/api/import/supplement-logs', { method: 'POST', body: form })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(j?.error || 'Upload failed')
      }
      onUploadComplete()
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${drag ? 'border-slate-900 bg-slate-50' : 'border-slate-300'}`}
        onDragEnter={(e) => { e.preventDefault(); setDrag(true) }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleSelected(Array.from(e.dataTransfer.files || [])) }}
      >
        <input id="supp-log-up" type="file" accept=".csv,.xlsx" multiple className="hidden"
               onChange={(e) => handleSelected(Array.from(e.target.files || []))} />
        {isUploading ? (
          <div className="space-y-2">
            <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mx-auto" />
            <div className="text-sm">Uploading…</div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-sm font-medium">Upload your supplement spreadsheet</div>
            <div className="text-xs text-slate-600">CSV or Excel with supplement names and dates</div>
            <button className="mt-2 h-9 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                    onClick={() => (document.getElementById('supp-log-up') as HTMLInputElement)?.click()}>
              Choose file
            </button>
          </div>
        )}
      </div>
      {files.length > 0 && (
        <div className="text-xs text-slate-600">{files.length} file(s) selected</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}


