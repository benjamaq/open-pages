'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TodaySupplementItem {
  id: string
  name: string
}

export default function SupplementsTodayChecklist({ userId, items }: { userId?: string; items: TodaySupplementItem[] }) {
  const [takenMap, setTakenMap] = useState<Record<string, boolean>>({})
  const today = useMemo(() => new Date().toLocaleDateString('sv-SE'), [])

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      const supabase = createClient()
      const { data } = await supabase
        .from('supplement_logs')
        .select('supplement_id, taken')
        .eq('user_id', userId)
        .eq('local_date', today)
      const map: Record<string, boolean> = {}
      ;(data as any[] | null)?.forEach((row) => { map[row.supplement_id] = !!row.taken })
      setTakenMap(map)
    }
    load()
  }, [userId, today])

  const onToggle = async (supplementId: string, next: boolean) => {
    if (!userId) return
    setTakenMap((m) => ({ ...m, [supplementId]: next }))
    const supabase = createClient()
    // Upsert log for today
    await supabase
      .from('supplement_logs')
      .upsert({ user_id: userId, supplement_id: supplementId, local_date: today, taken: next }, { onConflict: 'user_id,supplement_id,local_date' })
  }

  if (!items || items.length === 0) return null

  return (
    <div className="mt-4">
      <div className="text-sm font-semibold text-gray-700 mb-2">Today's Supplements</div>
      <div className="space-y-2">
        {items.map((it) => (
          <label key={it.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-md px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900"
              checked={!!takenMap[it.id]}
              onChange={(e) => onToggle(it.id, e.target.checked)}
            />
            <span className="text-sm text-gray-800">{it.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}




