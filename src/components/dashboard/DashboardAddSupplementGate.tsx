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
    // Build dose string from structured fields (required)
    const unitRaw = (details.doseUnit || '').trim()
    const unitNorm = (() => {
      const lc = unitRaw.toLowerCase()
      if (!lc) return ''
      if (lc === 'capsule' || lc === 'capsules') return 'caps'
      if (lc === 'iu') return 'IU'
      return lc
    })()
    const doseText = `${Number(details.dailyDose || 0) || ''}${unitNorm ? (unitNorm === 'IU' ? ' IU' : ` ${unitNorm}`) : ''}`.trim()
    // Require at least one time of day; map to single timing label
    const timingLabel = (() => {
      const t = Array.isArray(details.timeOfDay) ? details.timeOfDay : []
      if (!t || t.length === 0) return ''
      if (t.includes('morning')) return 'Morning'
      if (t.includes('afternoon')) return 'Afternoon'
      if (t.includes('evening')) return 'Evening'
      if (t.includes('night')) return 'Before bed'
      return ''
    })()
    if (!doseText) {
      alert('Please enter your daily dose (e.g., 400mg, 2 caps).')
      return
    }
    if (!timingLabel) {
      alert('Please choose when you usually take it (Morning / Afternoon / Evening / Before bed).')
      return
    }
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
      // New required fields
      dose: doseText,
      timing: timingLabel,
      ...(brand ? { brand } : {})
    }
    try { console.log('POSTING:', payload) } catch {}
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
            startDate: details.startedAt,
            endDate: details.isActive === false && details.stoppedAt ? details.stoppedAt : null
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


