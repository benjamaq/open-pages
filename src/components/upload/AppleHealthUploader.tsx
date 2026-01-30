'use client'
import { useState } from 'react'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'

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
    try { console.log('[uploader] File selected:', file?.name, file?.size, file?.type) } catch {}

    const name = (file.name || '').toLowerCase()
    const isZip = name.endsWith('.zip')
    const isXml = name.endsWith('.xml')
    if (!isZip && !isXml) {
      setError('Please upload Apple Health export.zip or export.xml')
      return
    }
    // If the user picked an XML from the Apple Health export, enforce correct filename
    if (isXml) {
      const base = (name.split('/').pop() || name)
      if (base === 'export_cda.xml') {
        setError('Please select the Apple Health file named "export.xml" (not "export_cda.xml").')
        return
      }
      if (base !== 'export.xml') {
        setError('Please select the Apple Health file named "export.xml" from your exported folder.')
        return
      }
    }

    setIsUploading(true)
    try {
      try { console.log('[uploader] Starting upload...') } catch {}
      try { console.log('[uploader] Uploading to storage...') } catch {}
      // Upload ZIP directly to Supabase Storage to avoid function body size limits
      const supabase = createBrowserSupabase()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user?.id) {
        setError('Please sign in to upload your data.')
        return
      }
      const userId = userData?.user?.id || 'anon'
      const safeName = name.replace(/[^a-z0-9._-]+/g, '_')
      const storagePath = `health/${userId}/${Date.now()}-${safeName}`
      // Ensure bucket exists and has permissive mime rules
      try { await fetch('/api/storage/ensure-uploads', { method: 'POST' }) } catch {}
      const { data: upData, error: upErr } = await supabase.storage
        .from('uploads')
        .upload(storagePath, file, { upsert: true, contentType: 'application/octet-stream' })
      if (upErr) throw new Error(upErr.message || 'Failed to store file')
      try { console.log('[uploader] Storage result:', { storagePath, data: upData }) } catch {}

      // Trigger server-side processing from storage via universal endpoint (streaming)
      try { console.log('[uploader] Calling universal API...') } catch {}
      const res = await fetch('/api/upload/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath, bucket: 'uploads', fileName: file.name })
      })
      let j: any = {}
      try {
        j = await res.json()
      } catch {
        j = {}
      }
      try {
        console.log('[uploader] Universal API response status:', res.status)
        console.log('[uploader] Universal API response:', j)
      } catch {}
      if (!res.ok) throw new Error(j?.error || j?.details || 'Upload failed')
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
          Easiest: upload the <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100">export.zip</span> you downloaded from Apple&nbsp;Health.
          If you already unzipped it, choose the file named <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100">export.xml</span>
          <span className="text-slate-500"> (not <span className="font-mono">export_cda.xml</span>)</span>. You can also continue without uploading.
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
          <li>Upload the <span className="font-mono">export.zip</span> here<br/><span className="text-xs text-slate-500">(no need to open it)</span></li>
        </ol>
      </div>

      {/* Visual hint for correct file */}
      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <svg className="w-5 h-5 text-slate-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 2a2 2 0 00-2 2v12c0 1.1.9 2 2 2h8.5a1 1 0 00.7-.3l3-3a1 1 0 00.3-.7V4a2 2 0 00-2-2H4zm8 12h2l-2 2v-2zM6 6h6v2H6V6zm0 3h6v2H6V9z" />
        </svg>
        <div className="text-sm">
          <div className="font-medium text-slate-900 mb-1">Choose the correct file</div>
          <ul className="text-slate-700 text-sm space-y-1">
            <li><span className="text-emerald-600">✔</span> <span className="font-mono">export.zip</span> (recommended)</li>
            <li><span className="text-emerald-600">✔</span> <span className="font-mono">export.xml</span> (if you already unzipped)</li>
            <li><span className="text-rose-600">✕</span> <span class="text-slate-700">export_cda.xml</span> (this is the clinical export — not supported)</li>
            <li className="text-slate-500">Other folders like <span className="font-mono">workout-routes/</span> and <span className="text-slate-700">electrocardiograms/</span> are expected — you can ignore them.</li>
          </ul>
        </div>
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
            accept=".zip,.xml"
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
                Upload export.zip (or choose export.xml)
              </button>
              {fileName && <div className="text-xs text-slate-600">Selected: {fileName}</div>}
              <div className="text-xs text-slate-500">
                We’ll find <span className="font-mono">export.xml</span> inside your ZIP automatically. Extra folders/files are expected.
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


