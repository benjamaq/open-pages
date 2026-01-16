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
  // Fetch supplements
  const { data: supps } = await admin
    .from('user_supplement')
    .select('id,name,monthly_cost_usd')
    .eq('user_id', userId)
    .or('is_active.eq.true,is_active.is.null')
  const supplements = (supps || []).map((s: any) => ({
    id: String(s.id),
    name: String(s.name || 'Supplement'),
    cost: Number(s.monthly_cost_usd || 0)
  }))
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

  for (const e of (entries || [])) {
    const intake = (e as any).supplement_intake || null
    if (!intake || typeof intake !== 'object') continue
    const isClean = !(Array.isArray((e as any).tags) && (e as any).tags.length > 0)
    // We count ON/OFF; "clean" is used downstream via required OFF limits. For emails we just need ON/OFF counts.
    for (const s of supplements) {
      const v = (intake as any)[s.id]
      if (v === undefined) continue
      const vs = String(v).toLowerCase()
      if (vs === 'skipped' || vs === 'off' || vs === 'not_taken' || vs === 'false' || vs === '0') {
        if (isClean) bySupp[s.id].off += 1
      } else if (vs === 'taken' || vs === 'true' || vs === '1') {
        bySupp[s.id].on += 1
      }
    }
  }

  // Compute evidence-based progress per supplement (same formula family as dashboard)
  const percs: Array<{ pct: number; cost: number }> = []
  for (const s of supplements) {
    const cat = inferCategory(s.name)
    const reqOn = requiredDaysFor(cat)
    const reqOff = Math.min(5, Math.max(3, Math.round(reqOn / 4)))
    const on = Math.max(0, bySupp[s.id]?.on || 0)
    const off = Math.max(0, bySupp[s.id]?.off || 0)
    const onClamped = Math.min(on, reqOn)
    const offClamped = Math.min(off, reqOff)
    const denom = Math.max(1, reqOn + reqOff)
    const pct = Math.max(0, Math.min(100, Math.round(((onClamped + offClamped) / denom) * 100)))
    percs.push({ pct, cost: s.cost })
  }

  const totalCost = percs.reduce((s, x) => s + (x.cost || 0), 0)
  if (totalCost > 0) {
    const w = Math.round(percs.reduce((s, x) => s + (x.pct * (x.cost || 0)), 0) / totalCost)
    return Math.max(0, Math.min(100, w))
  }
  const avg = Math.round(percs.reduce((s, x) => s + x.pct, 0) / Math.max(percs.length, 1))
  return Math.max(0, Math.min(100, avg))
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
  opts?: { targetLocalYmd?: string }
): Promise<Metrics> {
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
    if (exactRows && exactRows.length > 0) {
      const r = exactRows[0] as any
      const energy = toNumOrUndef(r.energy)
      const focus = toNumOrUndef(r.focus)
      const mood = toNumOrUndef(r.mood)
      const sleepRaw = (r.sleep_quality != null ? r.sleep_quality : r.sleep)
      const sleep = toNumOrUndef(sleepRaw)
      if (energy != null || focus != null || sleep != null || mood != null) {
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
    return { energy: ce, focus: cf, sleep: cs, mood: cm, date: (c.created_at ? String(c.created_at).slice(0,10) : undefined) }
  }
  return { energy, focus, sleep, mood, date: (r.local_date ? String(r.local_date).slice(0,10) : undefined) }
}


