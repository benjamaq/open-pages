'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SupplementDetailsModal, type SupplementDetails } from '@/app/onboarding/SupplementDetailsModal'

export default function DashboardAddSupplementGate() {
  const search = useSearchParams()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const add = search?.get('add')
    if (add === '1') {
      // Debounce repeat auto-opens across quick navigations/refreshes
      try {
        const now = Date.now()
        const last = Number(sessionStorage.getItem('dash_add_supp_last') || 0)
        // Only auto-open if we haven't done so in the last 20s
        if (!last || now - last > 20000) {
          setOpen(true)
          sessionStorage.setItem('dash_add_supp_last', String(now))
        }
      } catch {
        setOpen(true)
      }
      // Remove the query param to avoid reopen on refresh
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete('add')
        window.history.replaceState({}, '', url.toString())
      } catch {}
    }
  }, [search])

  if (!open) return null

  // Minimal product stub; the modal contains its own CatalogSearch and UI
  const productStub = {
    id: 'stub',
    productName: '',
    brandName: '',
    canonicalSupplementId: '',
    pricePerContainerDefault: 0,
    servingsPerContainerDefault: 0,
    dosePerServingAmountDefault: 1,
    dosePerServingUnitDefault: ''
  }

  async function handleSave(details: SupplementDetails) {
    // Create supplement by name
    const safeName = (details.name || '').trim() || 'Custom supplement'
    // Build dose string from structured fields (optional)
    const unitRaw = (details.doseUnit || '').trim()
    const unitNorm = (() => {
      const lc = unitRaw.toLowerCase()
      if (!lc) return ''
      if (lc === 'capsule' || lc === 'capsules') return 'caps'
      if (lc === 'iu') return 'IU'
      return lc
    })()
    const doseAmount = Number(details.dailyDose || 0) || 0
    const doseText = (doseAmount > 0 && unitNorm)
      ? `${doseAmount}${unitNorm === 'IU' ? ' IU' : ` ${unitNorm}`}`.trim()
      : ''
    // Time of day is optional; map to a single timing label when present
    const timingLabel = (() => {
      const t = Array.isArray(details.timeOfDay) ? details.timeOfDay : []
      if (!t || t.length === 0) return ''
      if (t.includes('morning')) return 'Morning'
      if (t.includes('afternoon')) return 'Afternoon'
      if (t.includes('evening')) return 'Evening'
      if (t.includes('night')) return 'Before bed'
      return ''
    })()
    // Brand: prefer explicit brand, else parse from name before comma
    const explicitBrand = (details.brandName || '').trim()
    const parsedFromName = (() => {
      const idx = safeName.indexOf(',')
      if (idx > 0) return safeName.slice(0, idx).trim()
      return ''
    })()
    const brand = explicitBrand || parsedFromName
    const payload = { 
      name: safeName,
      monthly_cost_usd: Math.min(80, Math.max(0, Number(details.monthlyCost || 0))),
      primary_goal_tags: Array.isArray(details.primaryGoals) ? details.primaryGoals : [],
      // Optional fields
      ...(doseText ? { dose: doseText } : {}),
      ...(timingLabel ? { timing: timingLabel } : {}),
      // Include backdated start to seed inferred_start_at on create
      ...(details.startedAt ? { startDate: String(details.startedAt).slice(0, 10) } : {}),
      ...(details.isActive === false && details.stoppedAt ? { endDate: String(details.stoppedAt).slice(0, 10) } : {}),
      ...(brand ? { brand } : {})
    }
    try { console.log('[DashboardAddSupplementGate] POST /api/supplements payload:', payload) } catch {}
    const create = await fetch('/api/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const j = await create.json().catch(() => ({}))
    if (!create.ok || !j?.id) {
      throw new Error(j?.error || 'Failed to create supplement')
    }
    const id = j.id as string
    // Optional initial period
    if (details.startedAt) {
      try {
        await fetch(`/api/supplements/${encodeURIComponent(id)}/periods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // API expects snake_case keys
            start_date: String(details.startedAt).slice(0, 10),
            end_date: (details.isActive === false && details.stoppedAt) ? String(details.stoppedAt).slice(0, 10) : null
          })
        })
      } catch {}
    }
    setOpen(false)
    // Trigger refresh so /api/supplements reloads
    try { window.location.reload() } catch {}
  }

  return (
    <SupplementDetailsModal
      product={productStub}
      onCancel={() => setOpen(false)}
      onSave={handleSave}
    />
  )
}


