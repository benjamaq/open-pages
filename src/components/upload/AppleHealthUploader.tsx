'use client'
import { useState } from 'react'

type Props = {
  onSuccess: () => void
  onSkip: () => void
}

export default function AppleHealthUploader({ onSuccess, onSkip }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    setFileName(file.name)

    const name = (file.name || '').toLowerCase()
    // Rejections with friendly messages
    if (name.endsWith('.xml')) {
      setError('Please upload the full Apple Health ZIP file. Apple includes everything we need inside it.')
      return
    }
    if (name.endsWith('.csv')) {
      setError('Please upload the ZIP file you downloaded from Apple Health — not a CSV.')
      return
    }
    // Browsers won’t provide folders directly; if they do, reject by no extension
    if (!name.includes('.') || (!name.endsWith('.zip') && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed')) {
      setError('Please upload the ZIP file you downloaded from Apple Health — not a folder.')
      return
    }
    if (!name.endsWith('.zip')) {
      setError('Please upload the full Apple Health ZIP file.')
      return
    }

    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload/apple-health', { method: 'POST', body: form })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Upload failed')
      setUploaded(true)
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Title + helper */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Upload Apple Health data (optional)</h2>
        <p className="text-slate-700 mt-2">
          If you use Apple Health, you can upload your data to speed things up.
          BioStackr also works perfectly if you skip this and check in manually.
        </p>
      </div>

      {/* Steps */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900 mb-2">How to export from your iPhone:</div>
        <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
          <li>Open Apple Health</li>
          <li>Tap your profile picture (top right)</li>
          <li>Tap Export All Health Data</li>
          <li>Wait for the export to finish</li>
          <li>Upload the ZIP file here<br/><span className="text-xs text-slate-500">(You don’t need to open it)</span></li>
        </ol>
      </div>

      {/* Uploader */}
      <div className="space-y-2">
        <div
          className="border-2 border-dashed rounded-xl p-8 text-center border-slate-300"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation();
            const f = e.dataTransfer.files?.[0]
            if (f) handleFile(f)
          }}
        >
          <input
            id="apple-health-zip"
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          {isUploading ? (
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mx-auto" />
              <div className="text-sm font-medium">Uploading…</div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => (document.getElementById('apple-health-zip') as HTMLInputElement)?.click()}
                className="h-10 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Upload Apple Health ZIP
              </button>
              {fileName && <div className="text-xs text-slate-600">Selected: {fileName}</div>}
              <div className="text-xs text-slate-500">
                We automatically extract what we need. Extra folders and files are normal — you don’t need to touch them.
              </div>
            </div>
          )}
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {/* Success */}
      {uploaded && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-lg font-semibold text-emerald-900">Apple Health connected</div>
          <div className="text-sm text-emerald-800 mt-1">
            We’re processing your data in the background. You can continue — results will improve as data is added.
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={onSuccess}
              className="inline-flex h-10 px-4 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Secondary path */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-slate-600 underline underline-offset-2 hover:text-slate-800"
        >
          Continue without uploading
        </button>
      </div>
    </div>
  )
}


