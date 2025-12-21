'use client'

import { useMemo, useState } from 'react'
import { addMonths, differenceInDays, format, max, min, parseISO, startOfMonth, subMonths } from 'date-fns'

type Period = {
  id: string
  start: string
  end: string | null
  note?: string | null
}

type Zoom = '3m'|'6m'|'12m'|'all'

export default function TimelineCanvas({
  supplementId,
  periods,
  onCreatePeriod,
  onUpdatePeriod,
  onDeletePeriod
}: {
  supplementId: string
  periods: Period[]
  onCreatePeriod?: (sid:string, p: Omit<Period,'id'>) => Promise<void> | void
  onUpdatePeriod?: (sid:string, p: Period) => Promise<void> | void
  onDeletePeriod?: (sid:string, periodId: string) => Promise<void> | void
}) {
  const [zoom, setZoom] = useState<Zoom>('12m')

  const [minDate, maxDate] = useMemo(()=>{
    if(periods.length===0){
      const end = new Date(); return [subMonths(end, 12), end]
    }
    const starts = periods.map(p=>parseISO(p.start))
    const ends = periods.map(p=>p.end?parseISO(p.end):new Date())
    return [min(starts), max(ends)]
  },[periods])

  const windowEnd = new Date()
  const windowStart = useMemo(()=>{
    if(zoom==='all') return startOfMonth(minDate)
    const months = zoom==='3m'?3:zoom==='6m'?6:12
    return startOfMonth(subMonths(windowEnd, months-1))
  },[zoom, minDate, windowEnd])

  const monthsArr = useMemo(()=>{
    const arr: Date[] = []
    let cur = startOfMonth(windowStart)
    while(cur <= windowEnd || (zoom==='all' && cur <= maxDate)){
      arr.push(cur)
      cur = addMonths(cur, 1)
      if(zoom!=='all' && arr.length>24) break
    }
    return arr
  },[windowStart, windowEnd, zoom, maxDate])

  return (
    <div className="grid gap-3">
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        {(['3m','6m','12m','all'] as Zoom[]).map(z=>(
          <button key={z} onClick={()=>setZoom(z)} className={`px-3 py-1.5 rounded-lg text-sm ${zoom===z?'bg-gray-900 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {z.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={async()=>{ 
              await onCreatePeriod?.(supplementId, { start: new Date().toISOString().slice(0,10), end: null })
            }}
            className="px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700"
          >
            + Add period (start today)
          </button>
        </div>
      </div>

      {/* Month header */}
      <div className="flex text-xs text-gray-500 select-none">
        {monthsArr.map((m,i)=>(
          <div key={i} className="w-24 shrink-0 text-center">{format(m,'MMM yyyy')}</div>
        ))}
      </div>

      {/* Track */}
      <div className="relative flex overflow-x-auto rounded-xl border bg-white p-3" aria-label="Supplement timeline">
        <div className="relative h-8">
          {periods.map(p=>{
            const s = parseISO(p.start)
            const e = p.end? parseISO(p.end) : new Date()
            const leftMonths = differenceInDays(s, windowStart)/30.4
            const widthMonths = Math.max(0.7, differenceInDays(e, s)/30.4)
            return (
              <div key={p.id}
                   className="absolute top-1 h-6 rounded-full bg-emerald-500/85 hover:bg-emerald-600 cursor-pointer"
                   style={{ left: `${leftMonths*96}px`, width: `${widthMonths*96}px` }}
                   title={`${format(s,'PP')} → ${p.end?format(e,'PP'):'Present'}`}>
                {p.end && <div className="absolute right-[-2px] top-[-2px] h-10 w-[3px] bg-rose-400 rounded-sm" />}
              </div>
            )
          })}

          {/* Month grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="flex h-full">
              {monthsArr.map((_,i)=>(
                <div key={i} className="w-24 shrink-0 border-r border-gray-100/80" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Period table */}
      <div className="mt-2 rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="[&>th]:py-2 [&>th]:px-3 text-left text-gray-500">
              <th>Period</th><th>Days</th><th>Note</th><th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {periods.map(p=>{
              const s = parseISO(p.start)
              const e = p.end? parseISO(p.end) : new Date()
              const days = Math.max(1, differenceInDays(e, s)+1)
              return (
                <tr key={p.id} className="[&>td]:py-2 [&>td]:px-3 border-t">
                  <td>{format(s,'PP')} → {p.end?format(e,'PP'):'Present'}</td>
                  <td>{days}</td>
                  <td className="max-w-[340px] truncate">{p.note ?? '—'}</td>
                  <td className="text-right">
                    <button
                      onClick={async()=>{
                        const end = p.end ? null : new Date().toISOString().slice(0,10)
                        await onUpdatePeriod?.(supplementId, { ...p, end })
                      }}
                      className="mr-2 rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      {p.end ? 'Mark active' : 'End today'}
                    </button>
                    <button
                      onClick={async()=>{ if(confirm('Delete this period?')) await onDeletePeriod?.(supplementId,p.id) }}
                      className="rounded-lg border px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


