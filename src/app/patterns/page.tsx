'use server'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import InsightsViewTracker from './InsightsViewTracker'

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
    .order('created_at', { ascending: false })

  // Normalize new/old insight shapes and group by key
  const EXCLUDED_KEYS = new Set(['best_day','seven_day_trend','best_worst_day','worst_day'])
  const normalized = (allInsights || [])
    .map((ins: any) => {
      const key = ins?.context?.insight_key || ins?.context?.insightKey
      const title = ins?.context?.topLine || ins?.context?.title
      const discovery = ins?.context?.discovery || ins?.context?.message
      const action = ins?.context?.action || ins?.context?.actionable
      const icon = ins?.context?.icon
      return { ...ins, _key: key, _title: title, _discovery: discovery, _action: action, _icon: icon }
    })
    .filter((ins: any) => ins._key && !EXCLUDED_KEYS.has(ins._key))

  const grouped = new Map<string, any>()
  normalized.forEach((ins: any) => {
    const key = ins._key
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

  // Fallback: recent insights even if no insightKey present (e.g., single detections or new format)
  const recentFallback = (allInsights || [])
    .map((ins: any) => {
      const key = ins?.context?.insight_key || ins?.context?.insightKey || null
      const title = ins?.context?.topLine || ins?.context?.title
      const discovery = ins?.context?.discovery || ins?.context?.message
      const action = ins?.context?.action || ins?.context?.actionable
      const icon = ins?.context?.icon
      return { ...ins, _key: key, _title: title, _discovery: discovery, _action: action, _icon: icon }
    })
    .filter((p: any) => !!(p._title || p._discovery || p._action))
    .slice(0, 10)

  // Classify additional cards
  function determineType(title: string = '', description: string = ''): 'pattern' | 'warning' | 'milestone' | 'observation' {
    const t = title.toLowerCase(); const d = description.toLowerCase();
    if (t.includes('breakthrough') || t.includes('best') || t.includes('worst') || t.includes('lowest') || t.includes('highest') || t.includes('first time')) return 'milestone'
    if (t.includes('climbing') || t.includes('increasing') || t.includes('declined') || t.includes('declining') || t.includes('getting worse') || t.includes('worsening') || t.includes('warning') || d.includes('dropped significantly')) return 'warning'
    if (t.includes('linked to') || t.includes('appears to') || t.includes('affect') || t.includes('correlated with') || t.includes(' vs ') || t.includes('when your') || t.includes('with ') || t.includes('without ') || d.includes(' vs ')) return 'pattern'
    return 'observation'
  }
  const classified = (allInsights || []).map((ins: any) => {
    const title = ins?.context?.topLine || ins?.context?.title || ''
    const desc = ins?.context?.discovery || ins?.context?.message || ''
    return { ...ins, _title: title, _discovery: desc, _type: determineType(title, desc) }
  })
  const warnings = classified.filter((c: any) => c._type === 'warning')
  const milestones = classified.filter((c: any) => c._type === 'milestone')
  const observations = classified.filter((c: any) => c._type === 'observation')

  const { count: daysTracked } = await supabase
    .from('daily_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/dash" className="text-sm text-gray-600 hover:text-gray-900 mb-3 inline-block">← Back to dashboard</Link>
          <h1 className="text-3xl font-bold text-center">Your Pattern Dashboard</h1>
          <p className="text-base text-gray-900 text-center mt-2">
            {(daysTracked || 0)} days tracked • {uniquePatterns.length} patterns found • {confirmed.length} confirmed
          </p>
          <p className="text-sm text-gray-600 text-center mt-2 max-w-2xl mx-auto">We analyze your data to find what affects your health. Patterns become confirmed after appearing multiple times.</p>
        </div>

        <InsightsViewTracker insights={[...confirmed, ...emerging]} />

        {/* Warnings */}
        {warnings.length > 0 && (
          <section className="mb-12 warnings-section">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">🚨 Attention Needed</h2>
              <p className="text-base text-gray-500">These trends need your attention.</p>
            </div>
            <div className="flex flex-col gap-4">
              {warnings.map((w: any) => (
                <div key={w.id} className="bg-red-50 rounded-xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-red-600">
                  <div className="text-red-600 text-xs font-bold uppercase tracking-wide mb-3">WARNING</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{w._title || w.context?.topLine}</h3>
                  <p className="text-base text-gray-700 leading-relaxed">{w._discovery || w.context?.discovery}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {milestones.length > 0 && (
          <section className="milestones-section mb-12">
            <div className="mb-6"><h2 className="text-2xl font-bold text-gray-900">✨ Your Wins</h2><p className="text-base text-gray-500">Breakthrough moments worth celebrating.</p></div>
            <div className="flex flex-col gap-4">
              {milestones.map((m: any) => (
                <div key={m.id} className="bg-amber-50 rounded-xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-amber-500">
                  <div className="text-amber-600 text-xs font-bold uppercase tracking-wide mb-3">MILESTONE</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{m._title || m.context?.topLine}</h3>
                  <p className="text-base text-gray-700 leading-relaxed">{m._discovery || m.context?.discovery}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {observations.length > 0 && (
          <section className="observations-section mb-12">
            <div className="mb-6"><h2 className="text-2xl font-bold text-gray-900">📊 Recent Observations</h2><p className="text-base text-gray-500">Trends in your metrics.</p></div>
            <div className="flex flex-col gap-4">
              {observations.map((o: any) => (
                <div key={o.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-gray-400">
                  <div className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-3">OBSERVATION</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{o._title || o.context?.topLine}</h3>
                  <p className="text-base text-gray-700 leading-relaxed">{o._discovery || o.context?.discovery}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Removed previous empty-state info box to reduce confusion */}


        {confirmed.length > 0 && (
          <section className="mb-12">
            <div className="mb-6"><h2 className="text-2xl font-bold text-gray-900">💙 Confirmed Patterns</h2><p className="text-base text-gray-500">These patterns have appeared multiple times — act on these.</p></div>
            <div className="flex flex-col gap-4">
              {confirmed.map((p: any) => (
                <div key={p.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-purple-600">
                  <div className="text-purple-600 text-xs font-bold uppercase tracking-wide mb-3">PATTERN DISCOVERED</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{p._title || p.context?.topLine}</h3>
                  <p className="text-base text-gray-700 leading-relaxed">{p._discovery || p.context?.discovery}</p>
                  {(p._action || p.context?.action) && (<p className="text-base text-gray-700 leading-relaxed mt-3 pt-3 border-t border-gray-200"><span className="font-bold text-gray-900 mr-1">Insight:</span> {p._action || p.context?.action}</p>)}
                  <div className="text-xs text-gray-500 mt-2">Confirmed {p.count} times</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {emerging.length > 0 && (
          <section className="emerging-patterns-section">
            <div className="mb-6"><h2 className="text-2xl font-bold text-gray-900">🌱 Emerging Patterns</h2><p className="text-base text-gray-500">Keep watching — these need more data to confirm.</p></div>
            <div className="flex flex-col gap-4">
              {emerging.map((p: any) => (
                <div key={p.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-purple-600">
                  <div className="text-purple-600 text-xs font-bold uppercase tracking-wide mb-3">PATTERN DISCOVERED</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{p._title || p.context?.topLine}</h3>
                  <p className="text-base text-gray-700 leading-relaxed">{p._discovery || p.context?.discovery}</p>
                  <div className="text-xs text-gray-500 mt-2">Seen {p.count} time{p.count > 1 ? 's' : ''} • Need {3 - p.count} more</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {uniquePatterns.length === 0 && (
          <>
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📊</div>
              <h3 className="text-xl font-bold mb-1">No confirmed patterns yet</h3>
              <p className="text-gray-600">We show confirmed patterns here once they recur a few times. In the meantime, here are your most recent insights.</p>
            </div>

            {recentFallback.length > 0 ? (
              <section className="mb-8">
                <div className="mb-6"><h2 className="text-2xl font-bold text-gray-900">🕑 Recent insights</h2><p className="text-base text-gray-500">Latest updates across your tracking.</p></div>
                <div className="space-y-3">
                  {recentFallback.map((p: any) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{p._icon || p.context?.icon || '💡'}</span>
                        <div className="flex-1">
                          <div className="font-bold mb-1">{p._title || p._discovery || 'Insight'}</div>
                          {p._discovery && (
                            <div className="text-sm text-gray-700 mb-2">{p._discovery}</div>
                          )}
                          {p._action && (
                            <div className="text-sm font-semibold text-gray-900">→ {p._action}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">{new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Keep tracking daily and patterns will appear after 7-10 days.</p>
              </div>
            )}
          </>
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


