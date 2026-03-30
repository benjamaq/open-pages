'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const ADMIN_KEY_STORAGE = 'bs_admin_key'

type Cohort = {
  id: string
  slug: string
  brand_name: string
  product_name: string
  status: string | null
  recruitment_closes_at?: string | null
  max_participants?: number | null
  confirmed_participant_count?: number
  pipeline_participant_count?: number
}

type Participant = {
  display_name: string | null
  email: string
  enrolled_at: string
  confirmed_at: string | null
}

function adminHeaders(): HeadersInit {
  const headers: HeadersInit = {}
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    try {
      const k = sessionStorage.getItem(ADMIN_KEY_STORAGE) || ''
      if (k) headers['x-admin-key'] = k
    } catch {}
  }
  return headers
}

export default function AdminCohortsPage() {
  const [adminKey, setAdminKey] = useState('')
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ADMIN_KEY_STORAGE) || ''
      if (saved) setAdminKey(saved)
    } catch {}
  }, [])

  const saveKey = () => {
    try {
      const v = adminKey.trim()
      if (v) sessionStorage.setItem(ADMIN_KEY_STORAGE, v)
    } catch {}
  }

  const fetchCohorts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/cohorts', { headers: adminHeaders() })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error || res.statusText)
        setCohorts([])
        return
      }
      const j = await res.json()
      setCohorts((j as { cohorts?: Cohort[] }).cohorts || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load cohorts')
      setCohorts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCohorts()
  }, [fetchCohorts])

  const fetchParticipants = useCallback(async (cohortUuid: string) => {
    if (!cohortUuid) {
      setParticipants([])
      return
    }
    setLoadingRows(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cohorts?cohort_uuid=${encodeURIComponent(cohortUuid)}`, {
        headers: adminHeaders(),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error || res.statusText)
        setParticipants([])
        return
      }
      const j = await res.json()
      setParticipants((j as { participants?: Participant[] }).participants || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load participants')
      setParticipants([])
    } finally {
      setLoadingRows(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchParticipants(selectedId)
    else setParticipants([])
  }, [selectedId, fetchParticipants])

  const downloadCsv = () => {
    if (!selectedId) return
    saveKey()
    const url = `/api/admin/cohorts/export?cohort_uuid=${encodeURIComponent(selectedId)}`
    const h = new Headers()
    if (process.env.NODE_ENV === 'production') {
      const k = sessionStorage.getItem(ADMIN_KEY_STORAGE) || adminKey.trim()
      if (k) h.set('x-admin-key', k)
    }
    fetch(url, { headers: h })
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.blob()
      })
      .then((blob) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'confirmed-shipping.csv'
        a.click()
        URL.revokeObjectURL(a.href)
      })
      .catch((e) => setError(e?.message || 'Download failed'))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cohort shipping list</h1>
            <p className="text-sm text-gray-600 mt-1">Confirmed participants only (compliance gate passed).</p>
          </div>
          <Link href="/admin/waitlist" className="text-sm text-blue-600 hover:underline">
            ← Waitlist admin
          </Link>
        </div>

        {process.env.NODE_ENV === 'production' && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <label className="block text-sm font-medium text-gray-800 mb-1">Admin API key</label>
            <div className="flex gap-2 flex-wrap">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="ADMIN_API_KEY (stored in this browser only)"
                className="flex-1 min-w-[200px] rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  saveKey()
                  fetchCohorts()
                  if (selectedId) fetchParticipants(selectedId)
                }}
                className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Save & refresh
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {!loading && cohorts.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Recruitment overview</h2>
              <p className="text-xs text-gray-600 mt-1">
                Confirmed vs cap (max). Pipeline = applied + confirmed (toward capacity).
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Cohort</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Recruitment closes</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">Confirmed</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">Max</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">Pipeline / max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {cohorts.map((c) => {
                    const conf = c.confirmed_participant_count ?? 0
                    const pipe = c.pipeline_participant_count ?? 0
                    const max = c.max_participants
                    const closes = c.recruitment_closes_at
                      ? new Date(c.recruitment_closes_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'
                    return (
                      <tr key={c.id}>
                        <td className="px-3 py-2 text-gray-900">
                          {c.brand_name} · {c.product_name}
                          <div className="text-xs text-gray-500 font-mono">{c.slug}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{closes}</td>
                        <td className="px-3 py-2 text-right text-gray-900">{conf}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{max != null ? max : '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {max != null ? `${pipe} / ${max}` : `${pipe}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cohort</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value="">— Select cohort —</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand_name} · {c.product_name} ({c.slug})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchCohorts}
            className="mt-3 text-sm text-blue-600 hover:underline"
            disabled={loading}
          >
            Reload cohort list
          </button>
        </div>

        {selectedId && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-medium text-gray-900">Confirmed participants</h2>
              <button
                type="button"
                onClick={downloadCsv}
                disabled={loadingRows || participants.length === 0}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Download CSV
              </button>
            </div>
            {loadingRows ? (
              <div className="p-8 text-center text-gray-600">Loading…</div>
            ) : participants.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No confirmed participants for this cohort yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confirmed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {participants.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-sm text-gray-900">{p.display_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{p.email || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.enrolled_at ? new Date(p.enrolled_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.confirmed_at ? new Date(p.confirmed_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
