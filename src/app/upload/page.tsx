'use client'
import { useState } from 'react'
import Link from 'next/link'
import UploadInstructions from '@/components/upload/UploadInstructions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-gray-200 bg-white ${className}`}>{children}</div>
}
function Button({ children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={rest.type || 'button'}
      className={`inline-flex items-center rounded-lg bg-gray-900 text-white px-4 py-2 hover:opacity-90 disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

type UploadType = 'health' | 'supplements'

export default function UploadCenter() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadType, setUploadType] = useState<UploadType>('health')
  const [dragActive, setDragActive] = useState(false)
  const [lastResult, setLastResult] = useState<any | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [postUploadOpen, setPostUploadOpen] = useState(false)
  const [wearableStatus, setWearableStatus] = useState<any | null>(null)
  const [firstTimeUpload, setFirstTimeUpload] = useState<boolean>(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setSnow(true)
    if (e.type === 'dragleave') setSnow(false)
  }
  function setSnow(v: boolean) { setDragActive(v) }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) await handleFiles(files)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) await handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    setIsUploading(true)
    setLastError(null)
    try {
      if (uploadType === 'health') {
        // If any file is large, upload all to storage and trigger server-side streaming
        const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024 // 10MB
        const anyLarge = files.some(f => (f as any)?.size >= LARGE_FILE_THRESHOLD)
        if (anyLarge) {
          console.log('[UploadCenter] Large file detected. Using storage-based upload flow.')
          const supabase = createBrowserSupabase()
          const { data: u } = await supabase.auth.getUser()
          if (!u?.user?.id) {
            throw new Error('Please sign in to upload your data.')
          }
          const { data: s } = await supabase.auth.getSession()
          const accessToken = (s as any)?.session?.access_token
          if (!accessToken) throw new Error('Please sign in to upload your data.')
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
          const BUCKET = 'uploads'
          // Make sure bucket exists and allows required MIME types and size
          try { await fetch('/api/storage/ensure-uploads', { method: 'POST' }) } catch {}
          const userId = u?.user?.id || 'anon'
          const storagePaths: string[] = []
          for (const f of files) {
            const safeName = (f.name || 'file').toLowerCase().replace(/[^a-z0-9._-]+/g, '_')
            const path = `health/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
            console.log('[UploadCenter] Uploading to storage:', path, 'size:', (f as any)?.size)
            // Use XHR for progress and reliability in a single request
            await new Promise<void>((resolve, reject) => {
              try {
                const xhr = new XMLHttpRequest()
                xhr.open('POST', `${supabaseUrl}/storage/v1/object/${BUCKET}/${encodeURIComponent(path)}`)
                xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
                xhr.setRequestHeader('x-upsert', 'true')
                // Use a generic content type to avoid bucket MIME restrictions blocking zip/xml
                xhr.setRequestHeader('Content-Type', 'application/octet-stream')
                xhr.upload.onprogress = (e) => {
                  if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 100)
                    setUploadProgress(pct)
                  }
                }
                xhr.onerror = () => reject(new Error('Upload failed'))
                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) resolve()
                  else reject(new Error(`Upload failed: HTTP ${xhr.status}${xhr.responseText ? ` — ${xhr.responseText}` : ''}`))
                }
                xhr.send(f)
              } catch (err) {
                reject(err as any)
              }
            })
            storagePaths.push(path)
          }
          console.log('[UploadCenter] Calling universal endpoint with storagePaths:', storagePaths.length)
          const res = await fetch('/api/upload/universal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storagePaths, bucket: BUCKET })
          })
          const data = await res.json().catch(() => ({}))
          console.log('[UploadCenter] /api/upload/universal (storage) status:', res.status, 'payload:', data)
          if (!res.ok) throw new Error(data?.error || data?.details || 'Import failed')
          toast.success(data.message || 'Imported', { description: data.details || 'Upload complete' })
          setLastResult(data)
          setUploadProgress(null)
          // Fetch wearable status then navigate (no modal here)
          try {
            const ws = await fetch('/api/user/wearable-status?since=all', { cache: 'no-store' })
            if (ws.ok) {
              const wj = await ws.json()
              setWearableStatus(wj)
              const connectedNow = Boolean(wj?.wearable_connected)
              const days = Number((data?.results?.daysUpserted ?? wj?.wearable_days_imported ?? 0) || 0)
              if (connectedNow && days > 0) {
                try {
                  const params = new URLSearchParams()
                  params.set('upload', 'success')
                  params.set('days', String(days))
                  const src = Array.isArray(wj?.wearable_sources) && wj.wearable_sources.length > 0 ? wj.wearable_sources[0] : undefined
                  if (src) params.set('source', String(src))
                  window.location.href = `/dashboard?${params.toString()}`
                } catch {}
              }
            }
          } catch {}
        } else {
          // Small files: send directly as multipart
          console.log('[UploadCenter] Routing to /api/upload/universal with', files.length, 'small file(s)')
          const formData = new FormData()
          files.forEach(file => formData.append('files', file))
          const res = await fetch('/api/upload/universal', { method: 'POST', body: formData })
          const data = await res.json().catch(() => ({}))
          console.log('[UploadCenter] /api/upload/universal status:', res.status, 'payload:', data)
          if (!res.ok) throw new Error(data?.error || data?.details || 'Import failed')
          toast.success(data.message || 'Imported', { description: data.details || 'Upload complete' })
          setLastResult(data)
          // Fetch wearable status then navigate (no modal here)
          try {
            const ws = await fetch('/api/user/wearable-status?since=all', { cache: 'no-store' })
            if (ws.ok) {
              const wj = await ws.json()
              setWearableStatus(wj)
              const connectedNow = Boolean(wj?.wearable_connected)
              const days = Number((data?.results?.daysUpserted ?? wj?.wearable_days_imported ?? 0) || 0)
              if (connectedNow && days > 0) {
                try {
                  const params = new URLSearchParams()
                  params.set('upload', 'success')
                  params.set('days', String(days))
                  const src = Array.isArray(wj?.wearable_sources) && wj.wearable_sources.length > 0 ? wj.wearable_sources[0] : undefined
                  if (src) params.set('source', String(src))
                  window.location.href = `/dashboard?${params.toString()}`
                } catch {}
              }
            }
          } catch {}
        }
      } else {
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          console.log('[UploadCenter] Posting supplement file to /api/import/supplement-logs:', file.name)
          const res = await fetch('/api/import/supplement-logs', { method: 'POST', body: formData })
          const data = await res.json()
          console.log('[UploadCenter] Supplement logs response:', res.status, data)
          if (!res.ok) throw new Error(data?.error || 'Import failed')
          toast.success(data.message || 'Imported', { description: data.details })
          setLastResult(data)
        }
      }
      setTimeout(async () => {
        toast.info('Reanalyzing supplements with new data…')
        try {
          const r = await fetch('/api/engine/recompute', { method: 'POST' })
          if (r.ok) {
            toast.success('✨ Analysis complete!', {
              description: 'Ready to view your report.',
              action: { label: 'See my results', onClick: () => (window.location.href = '/onboarding/report-ready') }
            })
          } else {
            const j = await r.json().catch(() => ({}))
            toast.info('Recompute not available', { description: j?.error || 'Skipping this step for now.' })
          }
        } catch (e) {
          console.warn('[UploadCenter] Recompute call failed:', e)
          toast.info('Recompute not available', { description: 'Skipping this step for now.' })
        }
      }, 2000)
    } catch (e) {
      console.error(e)
      setLastError(e instanceof Error ? e.message : 'Unknown error')
      toast.error('Upload failed', { description: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/supp2.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="max-w-[760px] mx-auto px-6 py-16">
        <div className="rounded-2xl bg-white/95 shadow-sm ring-1 ring-black/[0.04] p-6 sm:p-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Upload Your Data</h1>
          <p className="text-gray-600">Import health data and supplement logs. We’ll handle the rest.</p>
        </div>
        <Link href="/dashboard">
          <Button className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap">
            Skip for now
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <Tabs value={uploadType} onValueChange={v => setUploadType(v as UploadType)}>
          <div className="border-b border-gray-200">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="health" className="py-3">Health Data</TabsTrigger>
              <TabsTrigger value="supplements" className="py-3">Supplement Logs</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="health" className="p-6 space-y-6">
            <UploadInstructions />
            <div
              className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-colors ${dragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* NOTE: use display:none + <label htmlFor> trigger (most reliable across browsers) */}
              <input id="health-upload" type="file" multiple accept=".zip,.xml,.csv,.json,.xlsx" onChange={handleFileInput} disabled={isUploading} style={{ display: 'none' }} />
              {isUploading ? (
                <div className="space-y-3">
                  <div className="h-2 w-full bg-gray-200 rounded">
                    <div
                      className="h-2 bg-blue-600 rounded"
                      style={{ width: `${uploadProgress ?? 10}%`, transition: 'width 0.2s ease' }}
                    />
                  </div>
                  <div className="text-sm text-gray-700 text-center">
                    {uploadProgress != null ? `Uploading… ${uploadProgress}%` : 'Preparing upload…'}
                  </div>
                  <div className="text-xs text-gray-500 text-center">Processing your data… Large files may take a minute.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-medium">Drop any health export here</p>
                  <p className="text-sm text-gray-600">Apple Health (ZIP or export.xml), WHOOP, Oura, Garmin, Fitbit — CSV or JSON</p>
                  <label
                    htmlFor="health-upload"
                    role="button"
                    tabIndex={0}
                    className="inline-flex items-center rounded-lg bg-gray-900 text-white px-4 py-2 hover:opacity-90 cursor-pointer select-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        ;(document.getElementById('health-upload') as HTMLInputElement | null)?.click()
                      }
                    }}
                  >
                    Choose Files
                  </label>
                </div>
              )}
            </div>

            <Card className="p-4 bg-gray-50">
              <p className="text-sm font-medium mb-2">📋 CSV Format (Generic):</p>
              <div className="bg-white p-3 rounded text-xs font-mono overflow-auto">
                date,sleep_quality,energy,hrv,resting_hr<br />
                2025-01-15,8,7,55,58<br />
                2025-01-16,7,6,52,61
              </div>
              <p className="text-xs text-gray-600 mt-2">
                <strong>Required:</strong> date, sleep_quality • <strong>Optional:</strong> energy, hrv, resting_hr, mood
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="supplements" className="p-6 space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* NOTE: use display:none + <label htmlFor> trigger (most reliable across browsers) */}
              <input id="supplement-upload" type="file" accept=".csv,.xlsx" onChange={handleFileInput} disabled={isUploading} style={{ display: 'none' }} />
              {isUploading ? (
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto" />
                  <p className="font-medium">Processing supplement logs…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-medium">Upload your supplement spreadsheet</p>
                  <p className="text-sm text-gray-600">Excel or CSV with supplement names and dates</p>
                  <label
                    htmlFor="supplement-upload"
                    role="button"
                    tabIndex={0}
                    className="inline-flex items-center rounded-lg bg-gray-900 text-white px-4 py-2 hover:opacity-90 cursor-pointer select-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        ;(document.getElementById('supplement-upload') as HTMLInputElement | null)?.click()
                      }
                    }}
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
            <Card className="p-4 bg-gray-50">
              <p className="text-sm font-medium mb-2">📋 Required Format:</p>
              <div className="bg-white p-3 rounded text-xs font-mono overflow-auto">
                supplement,start_date,end_date,dose,notes<br />
                Peptide: Epitalon,2024-01-15,2024-02-15,5mg,Morning<br />
                Creatine,2024-01-01,,5g,Still taking<br />
                Magnesium,2024-02-01,2024-03-01,400mg,Evening
              </div>
              <p className="text-xs text-gray-600 mt-2">
                <strong>Required:</strong> supplement, start_date • <strong>Optional:</strong> end_date (blank = still taking), dose, notes
              </p>
            </Card>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <svg className="h-5 w-5 text-blue-600 mt-1" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7h2v6h-2V7zm1 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/><path d="M21 11.5a9.5 9.5 0 1 1-19 0 9.5 9.5 0 0 1 19 0z" fill="none" stroke="currentColor"/></svg>
              <div className="text-sm">
                <p className="font-medium text-blue-900">Just export your spreadsheet as CSV</p>
                <p className="text-blue-700 mt-1">We’ll match supplements automatically and create all daily logs between start/end dates</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Result/Confirmation */}
      {!postUploadOpen && lastResult && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              {firstTimeUpload ? (
                <>
                  <div className="text-lg font-semibold">Baseline enhanced</div>
                  <div className="text-sm text-gray-700 mt-1">
                    {(() => {
                      const days = Number(((wearableStatus?.wearable_days_imported ?? lastResult?.results?.daysUpserted) ?? 0))
                      // Prefer detected source(s) from the upload response; fall back to wearableStatus
                      const srcMap = (lastResult?.results?.sources && typeof lastResult.results.sources === 'object') ? lastResult.results.sources as Record<string, number> : {}
                      const srcKey = (() => {
                        const entries = Object.entries(srcMap || {})
                        if (entries.length > 0) {
                          // Pick the source with the highest day count
                          entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                          return entries[0]?.[0]
                        }
                        const ws = Array.isArray(wearableStatus?.wearable_sources) && wearableStatus.wearable_sources.length > 0 ? wearableStatus.wearable_sources[0] : undefined
                        return ws
                      })()
                      return `${days} usable day${days === 1 ? '' : 's'} imported${srcKey ? ` from ${srcKey}` : ''}.`
                    })()}
                  </div>
                  <div className="text-sm text-gray-700 mt-2">
                    This data strengthens your baseline and improves confidence across every supplement you test.
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-semibold">Data updated</div>
                  <div className="text-sm text-gray-700 mt-1">
                    {Number(lastResult?.results?.daysUpserted || 0)} additional usable day{Number(lastResult?.results?.daysUpserted || 0) === 1 ? '' : 's'} imported.
                  </div>
                  <div className="text-sm text-gray-700 mt-2">Your baseline has been updated.</div>
                </>
              )}
              <div className="mt-4">
                <Button onClick={() => (window.location.href = '/dashboard')}>
                  Continue to dashboard
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <div className="font-medium text-gray-800">Summary</div>
              <div className="mt-1 space-y-0.5">
                {'results' in lastResult && typeof lastResult.results === 'object' && (
                  <>
                    {'sleeps' in lastResult.results && <div>Sleep days: {lastResult.results.sleeps}</div>}
                    {'physiological' in lastResult.results && <div>Recovery/HRV days: {lastResult.results.physiological}</div>}
                    {'journal' in lastResult.results && <div>Journal rows: {lastResult.results.journal}</div>}
                    {'upserts' in lastResult.results && <div className="font-semibold text-green-700">Upserts: {lastResult.results.upserts}</div>}
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Post-upload modal (kept for fallback paths; dashboard shows the primary success modal) */}
      {postUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-gray-200 max-w-lg w-[92%] p-6 sm:p-8">
            <>
              <div className="text-xl sm:text-2xl font-semibold text-center">Baseline enhanced</div>
              <div className="mt-2 text-center text-sm text-gray-700">
                {(() => {
                  const days = Number(((wearableStatus?.wearable_days_imported ?? lastResult?.results?.daysUpserted) ?? 0))
                  const srcMap = (lastResult?.results?.sources && typeof lastResult.results.sources === 'object') ? lastResult.results.sources as Record<string, number> : {}
                  const src = (() => {
                    const entries = Object.entries(srcMap || {})
                    if (entries.length > 0) {
                      entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                      return entries[0]?.[0]
                    }
                    const ws = Array.isArray(wearableStatus?.wearable_sources) && wearableStatus!.wearable_sources.length > 0 ? wearableStatus!.wearable_sources[0] : undefined
                    return ws
                  })()
                  return `${days} ${days === 1 ? 'day' : 'days'} of usable health data imported${src ? ` from ${src}` : ''}.`
                })()}
              </div>
              <div className="mt-4 text-sm text-gray-800 space-y-3">
                <p>
                  This data is used to strengthen your baseline — the reference point we compare against when supplements are ON vs OFF.
                </p>
                <p>
                  Where available, objective metrics (such as sleep and resting heart rate) are used to help separate real effects from day‑to‑day noise.
                </p>
                <p>
                  This improves confidence and can reduce the time needed to reach clear results.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    setPostUploadOpen(false)
                    try { localStorage.setItem('wearable_postupload_seen', '1') } catch {}
                    try { window.location.href = '/dashboard' } catch {}
                  }}
                >
                  Continue to Dashboard
                </Button>
              </div>
            </>
          </div>
        </div>
      )}
      {lastError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-700">
            <span className="font-semibold">Upload error:</span> {lastError}
          </div>
        </Card>
      )}
        </div>
      </div>
    </div>
  )
}


