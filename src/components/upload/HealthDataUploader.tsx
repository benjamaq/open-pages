'use client'
import { useState } from 'react'
import type { UploadResult } from '@/types/UploadResult'

export default function HealthDataUploader({
  onUploadComplete,
  endpoint = '/api/import/health-data',
  accept = '.zip,.xml,.csv,.json',
  title = 'Upload your health data file',
  helper = 'ZIP (Apple Health), XML, CSV, or JSON exports.',
}: {
  onUploadComplete: (result: UploadResult) => void
  endpoint?: string
  accept?: string
  title?: string
  helper?: string
}) {
  const [drag, setDrag] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  function onDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDrag(e.type === 'dragenter' || e.type === 'dragover')
    if (e.type === 'dragleave') setDrag(false)
  }

  async function handleSelected(list: File[]) {
    setError(null)
    setFiles(list)
    if (list.length === 0) return
    setIsUploading(true)
    try {
      const form = new FormData()
      list.forEach(f => form.append('files', f))
      const res = await fetch(endpoint, { method: 'POST', body: form })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Upload failed')
      onUploadComplete({
        success: true,
        message: j?.message || 'Upload complete',
        detectedMetrics: j?.results ? Object.keys(j.results) : undefined,
        dateRange: j?.dateRange
      })
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${drag ? 'border-slate-900 bg-slate-50' : 'border-slate-300'}`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDrag(false); handleSelected(Array.from(e.dataTransfer.files || [])) }}
      >
        <input id="health-uploader" type="file" multiple accept={accept} className="hidden"
               onChange={(e) => handleSelected(Array.from(e.target.files || []))} />
        {isUploading ? (
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mx-auto" />
            <div className="text-sm font-medium">Uploading…</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-base font-semibold">{title}</div>
            <div className="text-sm text-slate-600">{helper}</div>
            <div className="mt-3">
              <button
                className="h-10 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                onClick={() => (document.getElementById('health-uploader') as HTMLInputElement)?.click()}
              >
                Choose file
              </button>
            </div>
          </div>
        )}
      </div>
      {files.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
          <div className="font-medium mb-1">Selected files</div>
          <ul className="space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="truncate">{f.name} <span className="text-xs text-slate-500">({Math.round(f.size/1024)} KB)</span></span>
                <button className="text-xs text-slate-500 hover:text-red-600" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="text-xs text-slate-500">Oura, Garmin, Fitbit — and more</div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}


