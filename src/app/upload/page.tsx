'use client'
import { useState } from 'react'
import Link from 'next/link'
import UploadInstructions from '@/components/upload/UploadInstructions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-gray-200 bg-white ${className}`}>{children}</div>
}
function Button({ children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`inline-flex items-center rounded-lg bg-gray-900 text-white px-4 py-2 hover:opacity-90 disabled:opacity-50 ${className}`} {...rest}>{children}</button>
}

type UploadType = 'health' | 'supplements'

export default function UploadCenter() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadType, setUploadType] = useState<UploadType>('health')
  const [dragActive, setDragActive] = useState(false)
  const [lastResult, setLastResult] = useState<any | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

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
        // Route based on file type(s)
        const primary = files[0]
        const name = (primary?.name || '').toLowerCase()
        const isZip = name.endsWith('.zip') || name.includes('export.zip')
        const isAppleXml = name === 'export.xml' || name === 'export_cda.xml' || (name.endsWith('.xml') && name.includes('export'))
        const isWhoop = files.some(f => /whoop|physiological|journal|sleeps/i.test(f.name))
        console.log('[UploadCenter] Health files selected:', files.map(f => `${f.name} (${f.size})`))
        if ((isZip || isAppleXml) && files.length === 1) {
          // Apple Health ZIP → send as single 'file'
          const formData = new FormData()
          formData.append('file', primary)
          console.log('[UploadCenter] Routing to /api/upload/apple-health (apple health file:', name, ')')
          const res = await fetch('/api/upload/apple-health', { method: 'POST', body: formData })
          const data = await res.json().catch(() => ({}))
          console.log('[UploadCenter] /api/upload/apple-health status:', res.status, 'payload:', data)
          if (!res.ok) throw new Error(data?.error || data?.details || 'Import failed')
          toast.success(data.message || 'Imported', { description: data.details || 'Apple Health upload complete' })
          setLastResult(data)
        } else if (isWhoop) {
          // WHOOP CSV(s) → batch field 'files'
          const formData = new FormData()
          files.forEach((file) => formData.append('files', file))
          console.log('[UploadCenter] Routing to /api/upload/whoop with', files.length, 'files')
          const res = await fetch('/api/upload/whoop', { method: 'POST', body: formData })
          const data = await res.json().catch(() => ({}))
          console.log('[UploadCenter] /api/upload/whoop status:', res.status, 'payload:', data)
          if (!res.ok) throw new Error(data?.error || 'Import failed')
          toast.success(data.message || 'Imported', { description: data.details || 'Whoop upload complete' })
          setLastResult(data)
        } else {
          // Generic CSV/XML/JSON → import individually (auto-detects source)
          console.log('[UploadCenter] Routing to /api/import/health-data for', files.length, 'file(s)')
          let last
          for (const file of files) {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/import/health-data', { method: 'POST', body: formData })
            const data = await res.json().catch(() => ({}))
            console.log('[UploadCenter] /api/import/health-data status:', res.status, 'file:', file.name, 'payload:', data)
            if (!res.ok) throw new Error(data?.error || 'Import failed')
            last = data
          }
          if (last) {
            toast.success(last.message || 'Imported', { description: last.details || 'Import complete' })
            setLastResult(last)
          }
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
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Upload Your Data</h1>
          <p className="text-gray-600">Import health data and supplement logs. We’ll handle the rest.</p>
        </div>
        <Link href="/onboarding/report-ready"><Button>Skip for now</Button></Link>
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
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input id="health-upload" type="file" multiple accept=".zip,.csv,.xml,.json" onChange={handleFileInput} disabled={isUploading} className="hidden" />
              {isUploading ? (
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto" />
                  <p className="font-medium">Processing your data…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-medium">Drag & drop files here, or click to browse</p>
                  <p className="text-sm text-gray-600">Whoop, Oura, Apple Health, Garmin, Fitbit, Bevel, Athlytic, Livity</p>
                  <Button onClick={() => (document.getElementById('health-upload') as HTMLInputElement)?.click()}>Choose Files</Button>
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
              <input id="supplement-upload" type="file" accept=".csv,.xlsx" onChange={handleFileInput} disabled={isUploading} className="hidden" />
              {isUploading ? (
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto" />
                  <p className="font-medium">Processing supplement logs…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-medium">Upload your supplement spreadsheet</p>
                  <p className="text-sm text-gray-600">Excel or CSV with supplement names and dates</p>
                  <Button onClick={() => (document.getElementById('supplement-upload') as HTMLInputElement)?.click()}>Choose File</Button>
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
      {lastResult && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-semibold">Upload complete</div>
              <div className="text-sm text-gray-600 mt-1">{lastResult.message}</div>
              {lastResult.details && <div className="text-sm text-gray-700 mt-2">{lastResult.details}</div>}
              <div className="mt-4">
                <Button onClick={() => (window.location.href = '/onboarding/report-ready')}>
                  See my results →
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


