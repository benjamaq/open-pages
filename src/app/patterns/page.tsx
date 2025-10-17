'use server'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function PatternsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div className="p-6">Not authenticated</div>
  }

  const { data: allInsights } = await supabase
    .from('elli_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('message_type', 'insight')
    .not('context->>insight_key', 'in', '("best_day","seven_day_trend","best_worst_day","worst_day")')
    .order('created_at', { ascending: false })

  const grouped = new Map<string, any>()
  ;(allInsights || []).forEach((ins: any) => {
    const key = ins?.context?.insight_key
    if (!key) return
    if (!grouped.has(key)) {
      grouped.set(key, { ...ins, count: 1, last_seen: ins.created_at })
    } else {
      const g = grouped.get(key)
      g.count += 1
      if (new Date(ins.created_at) > new Date(g.last_seen)) g.last_seen = ins.created_at
    }
  })

  const uniquePatterns = Array.from(grouped.values())
  const confirmed = uniquePatterns.filter((p: any) => p.count >= 3).sort((a: any, b: any) => b.count - a.count)
  const emerging = uniquePatterns.filter((p: any) => p.count < 3).sort((a: any, b: any) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())

  const { count: daysTracked } = await supabase
    .from('daily_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/dash" className="text-sm text-gray-600 hover:text-gray-900 mb-3 inline-block">← Back to dashboard</Link>
          <h1 className="text-3xl font-bold text-center">What's Working For You</h1>
          <p className="text-base text-gray-900 text-center mt-2">
            {(daysTracked || 0)} days tracked • {uniquePatterns.length} patterns found • {confirmed.length} confirmed
          </p>
        </div>

        {/* Elli intro (brief accent) */}
        <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💙</span>
            <p className="text-sm text-gray-800">These are your proven patterns — act on these.</p>
          </div>
        </div>


        {confirmed.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">✅ Confirmed <span className="text-gray-500">(Seen 3+ times reliably)</span></h2>
            <div className="space-y-3">
              {confirmed.map((p: any) => (
                <div
                  key={p.id}
                  id={`insight-${p.context?.insight_key}`}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 border-l-4 border-l-green-500"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{p.context?.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">{p.context?.topLine}</div>
                      <div className="text-sm text-gray-700 mb-2">{p.context?.discovery}</div>
                      <div className="text-sm font-semibold text-gray-900 mb-2">→ {p.context?.action}</div>
                      <div className="text-xs text-gray-500">Confirmed {p.count} times</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {emerging.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-4">🔬 Emerging (Keep watching)</h2>
            <div className="space-y-3">
              {emerging.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 border-l-4 border-l-amber-500"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{p.context?.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold mb-1">{p.context?.topLine}</div>
                      <div className="text-sm text-gray-700 mb-2">{p.context?.discovery}</div>
                      <div className="text-xs text-gray-500">Seen {p.count} time{p.count > 1 ? 's' : ''} • Need {3 - p.count} more</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {uniquePatterns.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">No patterns yet</h3>
            <p className="text-gray-600">Keep tracking daily and patterns will appear after 7-10 days</p>
          </div>
        )}
      </div>
    </div>
  )
}


// Server Component child: fetch and render recent mentions for an insight
async function RecentMentions({ insightKey }: { insightKey?: string }) {
  if (!insightKey) return null as any
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null as any

  // Determine filter terms based on key prefixes
  const key = insightKey
  let factorSlug: string | null = null
  let where: any = null
  if (key.startsWith('lifestyle_')) {
    factorSlug = key.replace('lifestyle_', '')
    where = { column: 'lifestyle_factors', op: 'cs', value: [factorSlug] }
  } else if (key.startsWith('symptom_')) {
    factorSlug = key.replace('symptom_', '')
    where = { column: 'symptoms', op: 'cs', value: [factorSlug] }
  } else if (key.startsWith('exercise_')) {
    factorSlug = key.replace('exercise_', '')
    where = { column: 'exercise_type', op: 'eq', value: factorSlug }
  } else if (key.startsWith('protocol_')) {
    factorSlug = key.replace('protocol_', '')
    where = { column: 'protocols', op: 'cs', value: [factorSlug] }
  }
  if (!where) return null as any

  const since = new Date(); since.setDate(since.getDate() - 30)
  let q = supabase
    .from('daily_entries')
    .select('local_date, pain, journal, tags')
    .eq('user_id', user.id)
    .gte('local_date', since.toISOString().slice(0,10))
    .order('local_date', { ascending: false })
    .limit(30)
  if (where.op === 'eq') {
    q = (q as any).eq(where.column, where.value)
  } else if (where.op === 'cs') {
    q = (q as any).contains(where.column, where.value)
  }
  const { data: entries } = await q

  if (!entries || entries.length === 0) return null as any

  const items = entries.slice(0, 5).map((e: any) => {
    const date = new Date(e.local_date + 'T00:00:00')
    const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const note = (e.journal || e.tags?.join(', ') || '').toString().trim()
    const snippet = note ? `“${note.slice(0, 60)}${note.length > 60 ? '…' : ''}”` : `Pain ${e.pain ?? '—'}/10`
    const link = `/dash?date=${e.local_date}#daily-summaries`
    return { dateLabel, snippet, link }
  })

  return (
    <div className="mt-3">
      <div className="text-xs text-gray-600 mb-1">📅 Recent mentions:</div>
      <ul className="space-y-1">
        {items.map((it, idx) => (
          <li key={idx} className="text-xs text-gray-700">
            • <span className="font-medium">{it.dateLabel}</span>: {it.snippet} {' '}
            <Link href={it.link} className="text-purple-700 hover:text-purple-900">→ View day</Link>
          </li>
        ))}
      </ul>
    </div>
  ) as any
}


