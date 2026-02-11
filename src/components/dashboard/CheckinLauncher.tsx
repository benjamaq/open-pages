'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DailyCheckinModal from '@/components/DailyCheckinModal'
import { dedupedJson } from '@/lib/utils/dedupedJson'

export function CheckinLauncher() {
  const router = useRouter()
  const search = useSearchParams()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [todayItems, setTodayItems] = useState<any>({
    supplements: [],
    protocols: [],
    movement: [],
    mindfulness: [],
    food: [],
    gear: []
  })
  const [currentEnergy, setCurrentEnergy] = useState<number>(5)

  useEffect(() => {
    const val = search.get('checkin')
    if (val === 'open' || val === '1') {
      setOpen(true)
      // Clean the URL right after opening
      try { router.replace('/dashboard') } catch {}
    }
  }, [search, router])

  // Also support explicit event trigger: window.dispatchEvent(new Event('open:checkin:new'))
  useEffect(() => {
    const handler = () => setOpen(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('open:checkin:new' as any, handler as any)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open:checkin:new' as any, handler as any)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await dedupedJson<any>('/api/me', { cache: 'no-store', credentials: 'include' })
        if (!res.ok) return
        const data = res.data || {}
        if (cancelled) return
        if (data?.userId) setUserId(String(data.userId))
        if (data?.firstName) setUserName(String(data.firstName))
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  // Load active supplements for today’s checklist
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await dedupedJson<any>('/api/supplements', { cache: 'no-store' })
        const j = r.ok ? r.data : []
        if (cancelled) return
        const rows = Array.isArray(j) ? j : []
        const supplements = rows
          .filter((row: any) => row?.is_active !== false)
          .map((row: any) => ({
            id: String(row?.intake_id ?? row?.user_supplement_id ?? row?.id ?? row?.supplement_id ?? ''),
            name: String(row?.name ?? row?.label ?? row?.canonical_name ?? 'Supplement')
          }))
          .filter((s: any) => s.id)
        setTodayItems((ti: any) => ({ ...ti, supplements }))
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  // Load skip list from progress endpoint to surface "Skipping today" reminder
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await dedupedJson<any>('/api/progress/loop', { cache: 'no-store' })
        if (!r.ok) return
        const j = r.data || {}
        if (cancelled) return
        const skip = Array.isArray(j?.rotation?.action?.skip) ? j.rotation.action.skip : []
        const names = Array.from(
          new Map(
            skip
              .map((s: any) => String(s?.name || '').trim())
              .filter(Boolean)
              .map((n: string) => [n.toLowerCase(), n])
          ).values()
        )
        if (names.length > 0) {
          setTodayItems((ti: any) => ({ ...ti, skipNames: names }))
          try {
            const todayStr = new Date().toISOString().split('T')[0]
            localStorage.setItem('biostackr_skip_names_today', JSON.stringify({ date: todayStr, names }))
          } catch {}
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      {open && (
        <DailyCheckinModal
          isOpen={true}
          onClose={() => {
            setOpen(false)
            router.replace('/dashboard')
          }}
          onEnergyUpdate={(n: number) => setCurrentEnergy(n)}
          currentEnergy={currentEnergy}
          todayItems={todayItems}
          userId={userId || 'guest'}
        />
      )}
    </>
  )
}




