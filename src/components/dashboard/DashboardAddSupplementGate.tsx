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
    const create = await fetch('/api/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: safeName,
        monthly_cost_usd: Math.min(80, Math.max(0, Number(details.monthlyCost || 0)))
      })
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


