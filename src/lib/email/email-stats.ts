import { supabaseAdmin as defaultAdmin } from '@/lib/supabase/admin'

type SupabaseAdmin = typeof defaultAdmin

function normalizeDateKey(d: any): string {
  try {
    const s = String(d || '')
    if (!s) return ''
    return s.slice(0, 10)
  } catch {
    return ''
  }
}

function inferCategory(name: string): string {
  const nm = String(name || '').toLowerCase()
  if (/(magnesium|melatonin|gaba|glycine|sleep)/.test(nm)) return 'sleep'
  if (/(vitamin d|d3|b-complex|b12|iron|energy)/.test(nm)) return 'energy'
  if (/(omega|fish oil|ashwagandha|rhodiola|mood)/.test(nm)) return 'mood'
  if (/(cortisol|adaptogen|stress)/.test(nm)) return 'stress'
  if (/(protein|collagen|creatine|turmeric|curcumin|recovery)/.test(nm)) return nm.includes('creatine') ? 'cognitive' : 'recovery'
  if (/(lion|nootropic|memory|focus|cognitive)/.test(nm)) return 'cognitive'
  if (/(probiotic|prebiotic|digest)/.test(nm)) return 'digestion'
  return 'other'
}

function requiredDaysFor(category: string): number {
  switch (category) {
    case 'sleep': return 10
    case 'energy': return 12
    case 'mood': return 14
    case 'stress': return 14
    case 'recovery': return 16
    case 'cognitive': return 21
    case 'digestion': return 14
    default: return 14
  }
}

export async function getStackProgressForUser(admin: SupabaseAdmin, userId: string): Promise<number> {
  // Prefer stack_items as the canonical set (matches dashboard), with user_supplement linkage for intake keys
  // Resolve profile id
  let profileId: string | null = null
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    profileId = (profile as any)?.id || null
  } catch {}
  let supplements: Array<{ id: string; name: string; cost: number; created_at?: string; user_supplement_id?: string | null; primary_goal_tags?: string[]; tags?: string[] }> = []
  if (profileId) {
    const { data: items } = await admin
      .from('stack_items')
      .select('id,name,created_at,monthly_cost,user_supplement_id,primary_goal_tags,tags')
      .eq('profile_id', profileId)
    supplements = (items || []).map((it: any) => ({
      id: String(it.id),
      name: String(it.name || 'Supplement'),
      cost: Number(it.monthly_cost || 0),
      created_at: String(it.created_at || ''),
      user_supplement_id: (it as any)?.user_supplement_id || null,
      primary_goal_tags: Array.isArray((it as any)?.primary_goal_tags) ? (it as any).primary_goal_tags : [],
      tags: Array.isArray((it as any)?.tags) ? (it as any).tags : [],
    }))
  }
  // If no stack_items exist, fallback to user_supplement
  if (supplements.length === 0) {
    const { data: supps } = await admin
      .from('user_supplement')
      .select('id,name,monthly_cost_usd,created_at')
      .eq('user_id', userId)
      .or('is_active.eq.true,is_active.is.null')
    supplements = (supps || []).map((s: any) => ({
      id: String(s.id),
      name: String(s.name || 'Supplement'),
      cost: Number(s.monthly_cost_usd || 0),
      created_at: String(s.created_at || ''),
      user_supplement_id: String(s.id),
    }))
  }
  if (supplements.length === 0) return 0

  // Fetch last year of entries for ON/OFF derivation
  const since = new Date()
  since.setDate(since.getDate() - 365)
  const { data: entries } = await admin
    .from('daily_entries')
    .select('local_date,tags,supplement_intake')
    .eq('user_id', userId)
    .gte('local_date', since.toISOString().slice(0,10))

  const bySupp: Record<string, { on: number; off: number }> = {}
  for (const s of supplements) bySupp[s.id] = { on: 0, off: 0 }
  // Derive ON/OFF using both user_supplement_id and stack_items.id, matching dashboard logic
  for (const e of (entries || [])) {
    const intake = (e as any).supplement_intake || null
    if (!intake || typeof intake !== 'object') continue
    const tags = Array.isArray((e as any).tags) ? (e as any).tags : []
    const isClean = !(tags && tags.length > 0)
    for (const s of supplements) {
      const keyA = (s as any).user_supplement_id ? String((s as any).user_supplement_id) : undefined
      const keyB = String(s.id)
      const v = (keyA && (intake as any)[keyA] !== undefined) ? (intake as any)[keyA] : (intake as any)[keyB]
      if (v === undefined) continue
      const vs = String(v).toLowerCase()
      if (vs === 'skipped' || vs === 'off' || vs === 'not_taken' || vs === 'false' || vs === '0') {
        if (isClean) bySupp[s.id].off += 1
      } else if (vs === 'taken' || vs === 'true' || vs === '1') {
        bySupp[s.id].on += 1
      }
    }
  }
  try {
    const debugCounts = supplements.map((s) => ({
      id: s.id,
      name: s.name,
      user_supplement_id: (s as any).user_supplement_id || null,
      on: bySupp[s.id]?.on || 0,
      off: bySupp[s.id]?.off || 0,
      cost: (s as any).cost || 0
    }))
    // eslint-disable-next-line no-console
    console.log('[email-stats] ON/OFF counts:', JSON.stringify(debugCounts))
  } catch {}

  // Compute evidence-based progress per supplement (same formula family as dashboard)
  const percs: Array<{ pct: number; cost: number }> = []
  // Compute evidence-based progress per supplement (same as dashboard: ON+OFF evidence vs required)
  const datesSet = new Set<string>((entries || []).map((e: any) => String((e as any).local_date || '').slice(0,10)).filter(Boolean))
  const allDates = Array.from(datesSet).sort()
  const percs: Array<{ pct: number; cost: number; id?: string; name?: string }> = []
  for (const s of supplements) {
    const cat = inferCategory((s as any).name)
    const reqOn = requiredDaysFor(cat)
    const reqOff = Math.min(5, Math.max(3, Math.round(reqOn / 4)))
    const on = Math.max(0, bySupp[s.id]?.on || 0)
    const off = Math.max(0, bySupp[s.id]?.off || 0)
    // If ON/OFF cannot be derived (no intake keys), fallback to days-of-data since created_at
    let pct: number
    if (on === 0 && off === 0) {
      const createdRaw: string | undefined = (s as any)?.created_at
      let daysOfData = 0
      if (createdRaw) {
        const startKey = String(createdRaw).slice(0,10)
        const startTs = new Date(`${startKey}T00:00:00Z`).getTime()
        daysOfData = allDates.reduce((acc, d) => acc + (new Date(`${d}T00:00:00Z`).getTime() >= startTs ? 1 : 0), 0)
      } else {
        daysOfData = allDates.length
      }
      if (daysOfData === 0 && allDates.length > 0) daysOfData = 1
      pct = Math.max(0, Math.min(100, Math.round((daysOfData / Math.max(1, reqOn)) * 100)))
    } else {
      const onClamped = Math.min(on, reqOn)
      const offClamped = Math.min(off, reqOff)
      const denom = Math.max(1, reqOn + reqOff)
      pct = Math.max(0, Math.min(100, Math.round(((onClamped + offClamped) / denom) * 100)))
    }
    percs.push({ pct, cost: (s as any).cost || 0, id: s.id, name: s.name })
  }
  try {
    // eslint-disable-next-line no-console
    console.log('[email-stats] per-supp progress:', JSON.stringify(percs))
  } catch {}

  const totalCost = percs.reduce((s, x) => s + (x.cost || 0), 0)
  let finalPct: number
  if (totalCost > 0) {
    finalPct = Math.round(percs.reduce((s, x) => s + (x.pct * (x.cost || 0)), 0) / totalCost)
  } else {
    finalPct = Math.round(percs.reduce((s, x) => s + x.pct, 0) / Math.max(percs.length, 1))
  }
  try {
    // eslint-disable-next-line no-console
    console.log('[email-stats] final clarity %:', { finalPct, totalCost })
  } catch {}
  return Math.max(0, Math.min(100, finalPct))
}

function toNumOrUndef(v: any): number | undefined {
  if (typeof v === 'number' && isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (isFinite(n)) return n
  }
  return undefined
}

type Metrics = { energy?: number; focus?: number; sleep?: number; mood?: number; date?: string } | null

export async function getLatestDailyMetrics(
  admin: SupabaseAdmin,
  userId: string,
  opts?: { targetLocalYmd?: string, timezone?: string }
): Promise<Metrics> {
  try {
    // eslint-disable-next-line no-console
    console.log('[email-stats] getLatestDailyMetrics start', { userId, targetLocalYmd: opts?.targetLocalYmd })
  } catch {}
  try {
    console.log('[email-stats] Looking for metrics:', {
      userId,
      targetDate: opts?.targetLocalYmd,
      timezone: opts?.timezone || '(unknown)'
    })
  } catch {}
  const since = new Date()
  since.setDate(since.getDate() - 7)
  // If a target local date is provided, try that exact date first
  if (opts?.targetLocalYmd) {
    const { data: exactRows } = await admin
      .from('daily_entries')
      .select('local_date,energy,focus,sleep,sleep_quality,mood')
      .eq('user_id', userId)
      .eq('local_date', opts.targetLocalYmd)
      .limit(1)
    try {
      console.log('[email-stats] exact date query rows', { userId, date: opts?.targetLocalYmd, count: (exactRows || []).length, sample: (exactRows && exactRows[0]) })
    } catch {}
    if (exactRows && exactRows.length > 0) {
      const r = exactRows[0] as any
      const energy = toNumOrUndef(r.energy)
      const focus = toNumOrUndef(r.focus)
      const mood = toNumOrUndef(r.mood)
      const sleepRaw = (r.sleep_quality != null ? r.sleep_quality : r.sleep)
      const sleep = toNumOrUndef(sleepRaw)
      if (energy != null || focus != null || sleep != null || mood != null) {
        try {
          console.log('[email-stats] Query result (exact):', {
            found: true,
            date: String(r.local_date).slice(0,10),
            energy, focus, sleep, mood
          })
          console.log('[email-stats] return exact metrics', { userId, date: String(r.local_date).slice(0,10), energy, focus, sleep, mood })
        } catch {}
        return { energy, focus, sleep, mood, date: (r.local_date ? String(r.local_date).slice(0,10) : undefined) }
      }
    }
  }

  const { data: rows } = await admin
    .from('daily_entries')
    .select('local_date,energy,focus,sleep,sleep_quality,mood')
    .eq('user_id', userId)
    .gte('local_date', since.toISOString().slice(0,10))
    .order('local_date', { ascending: false })
    .limit(1)
  try {
    console.log('[email-stats] window query rows', { userId, since: since.toISOString().slice(0,10), count: (rows || []).length, sample: (rows && rows[0]) })
  } catch {}
  if (!rows || rows.length === 0) return null
  const r = rows[0] as any
  const energy = toNumOrUndef(r.energy)
  const focus = toNumOrUndef(r.focus)
  const mood = toNumOrUndef(r.mood)
  const sleepRaw = (r.sleep_quality != null ? r.sleep_quality : r.sleep)
  const sleep = toNumOrUndef(sleepRaw)
  if (energy == null && focus == null && sleep == null && mood == null) {
    // Fallback: check traditional checkin table within 7 days
    const { data: checks } = await admin
      .from('checkin')
      .select('created_at,energy,focus,sleep,sleep_quality,mood')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
    if (!checks || checks.length === 0) return null
    const c = checks[0] as any
    const ce = toNumOrUndef(c.energy)
    const cf = toNumOrUndef(c.focus)
    const cm = toNumOrUndef(c.mood)
    const csRaw = (c.sleep_quality != null ? c.sleep_quality : c.sleep)
    const cs = toNumOrUndef(csRaw)
    if (ce == null && cf == null && cs == null && cm == null) return null
    try { console.log('[email-stats] return fallback checkin metrics', { userId, date: String(c.created_at).slice(0,10), energy: ce, focus: cf, sleep: cs, mood: cm }) } catch {}
    return { energy: ce, focus: cf, sleep: cs, mood: cm, date: (c.created_at ? String(c.created_at).slice(0,10) : undefined) }
  }
  try {
    console.log('[email-stats] Query result (window):', {
      found: true,
      date: String(r.local_date).slice(0,10),
      energy, focus, sleep, mood
    })
    console.log('[email-stats] return window metrics', { userId, date: String(r.local_date).slice(0,10), energy, focus, sleep, mood })
  } catch {}
  return { energy, focus, sleep, mood, date: (r.local_date ? String(r.local_date).slice(0,10) : undefined) }
}


