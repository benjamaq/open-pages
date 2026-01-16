import { supabaseAdmin as defaultAdmin } from '@/lib/supabase/admin'

type SupabaseLike = typeof defaultAdmin

type LatestMetrics = {
  energy?: number
  focus?: number
  sleep?: number
  mood?: number
} | null

function inferCategory(name: string, goals?: any): string {
  const nm = String(name || '').toLowerCase()
  const g: string[] = Array.isArray(goals) ? goals.map((t: any) => String(t).toLowerCase()) : []
  const hay = (g.join(' ') + ' ' + nm)
  if (/(magnesium|melatonin|gaba|glycine|sleep)/.test(hay)) return 'sleep'
  if (/(vitamin d|d3|b-complex|b12|iron|energy)/.test(hay)) return 'energy'
  if (/(omega|fish oil|ashwagandha|rhodiola|mood)/.test(hay)) return 'mood'
  if (/(cortisol|adaptogen|stress)/.test(hay)) return 'stress'
  if (/(protein|collagen|creatine|turmeric|curcumin|recovery)/.test(hay)) return nm.includes('creatine') ? 'cognitive' : 'recovery'
  if (/(lion|nootropic|memory|focus|cognitive)/.test(hay)) return 'cognitive'
  if (/(probiotic|prebiotic|digest)/.test(hay)) return 'digestion'
  return 'other'
}

function requiredDaysFor(cat: string): number {
  switch (cat) {
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

export async function computeStackProgressForUser(admin: SupabaseLike, userId: string): Promise<number> {
  // Resolve profile id (optional)
  const { data: profile } = await admin.from('profiles').select('id').eq('user_id', userId).maybeSingle()
  // Fetch stack items (prefer stack_items; fallback to user_supplement)
  let items: Array<{ id: string; name: string; monthly_cost?: number | null; created_at?: string | null; start_date?: string | null; inferred_start_at?: string | null; primary_goal_tags?: any; tags?: any }> = []
  {
    const { data } = await admin
      .from('stack_items')
      .select('id,name,inferred_start_at,start_date,monthly_cost,created_at,primary_goal_tags,tags')
      .eq('profile_id', (profile as any)?.id || '')
      .order('created_at', { ascending: true })
    if (data && data.length > 0) {
      items = data as any
    } else {
      const { data: us } = await admin
        .from('user_supplement')
        .select('id,name,inferred_start_at,created_at,monthly_cost_usd')
        .eq('user_id', userId)
        .or('is_active.eq.true,is_active.is.null')
        .order('created_at', { ascending: true })
      items = (us || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        inferred_start_at: r.inferred_start_at || r.created_at,
        created_at: r.created_at,
        monthly_cost: r.monthly_cost_usd,
      })) as any
    }
  }
  // Pull last year of daily_entries for ON/OFF evidence and distinct dates
  const since365 = new Date()
  since365.setDate(since365.getDate() - 365)
  const { data: entries365 } = await admin
    .from('daily_entries')
    .select('local_date,tags,supplement_intake')
    .eq('user_id', userId)
    .gte('local_date', since365.toISOString().slice(0,10))
  const allEntryDatesSet = new Set<string>((entries365 || []).map((e: any) => String(e.local_date).slice(0,10)))
  const toTs = (d: string) => { try { return new Date(`${d}T00:00:00Z`).getTime() } catch { return NaN } }
  // Map supplement id by name (fallback)
  const { data: userSuppRows } = await admin
    .from('user_supplement')
    .select('id,name')
    .eq('user_id', userId)
  const nameToUserSuppId = new Map<string, string>()
  if (userSuppRows) {
    for (const u of userSuppRows) {
      const nm = String((u as any).name || '').trim().toLowerCase()
      const uid = String((u as any).id)
      if (nm) nameToUserSuppId.set(nm, uid)
    }
  }
  const intakeByDate = new Map<string, Record<string, any>>()
  for (const e of entries365 || []) {
    const key = String((e as any).local_date).slice(0,10)
    const intake = (e as any).supplement_intake || null
    if (intake) intakeByDate.set(key, intake as any)
  }
  type Row = { progressPercent: number; monthlyCost?: number | null }
  const rows: Row[] = []
  for (const it of items || []) {
    const id = (it as any).id as string
    const name = (it as any).name || 'Supplement'
    const goals = (it as any).primary_goal_tags || (it as any).tags || []
    const category = inferCategory(name, goals)
    const requiredDays = requiredDaysFor(category)
    // Days of data = all entry days since start date
    let daysOfData = 0
    const createdAtRaw = (it as any).created_at as string | null
    const startDate = ((it as any).inferred_start_at as string | null) || ((it as any).start_date as string | null)
    const effectiveStart = (startDate && String(startDate).slice(0,10)) || (createdAtRaw ? String(createdAtRaw).slice(0,10) : null)
    if (effectiveStart) {
      const startKey = String(effectiveStart).slice(0,10)
      const startTs = toTs(startKey)
      const candidateDates = Array.from(allEntryDatesSet)
      daysOfData = candidateDates.reduce((acc, d) => acc + (toTs(d) >= startTs ? 1 : 0), 0)
    } else {
      daysOfData = allEntryDatesSet.size
    }
    // Derive ON/OFF from intake
    let on = 0, off = 0
    const suppId = nameToUserSuppId.get(String(name).trim().toLowerCase()) || id
    for (const e of entries365 || []) {
      const dKey = String((e as any).local_date).slice(0,10)
      const intake = (e as any).supplement_intake || null
      if (!intake || typeof intake !== 'object') continue
      const v = (intake as any)[suppId]
      if (v === undefined) continue
      const s = String(v).toLowerCase()
      if (s === 'skipped' || s === 'off' || s === 'not_taken' || s === 'false' || s === '0') off++
      else if (s === 'taken' || s === 'true' || s === '1') on++
    }
    const requiredOnDays = requiredDays
    const requiredOffDays = Math.min(5, Math.max(3, Math.round(requiredDays / 4)))
    const onClamped = Math.min(Math.max(0, on), requiredOnDays)
    const offClamped = Math.min(Math.max(0, off), requiredOffDays)
    const denom = Math.max(1, requiredOnDays + requiredOffDays)
    const evidencePct = ((onClamped + offClamped) / denom) * 100
    const progressPercent = Math.max(0, Math.min(100, Math.round(evidencePct)))
    rows.push({ progressPercent, monthlyCost: (it as any).monthly_cost })
  }
  if (rows.length === 0) return 0
  const totalCost = rows.reduce((s, r) => s + (Number(r.monthlyCost || 0)), 0)
  const stackProgress = totalCost > 0
    ? Math.round(rows.reduce((s, r) => s + (r.progressPercent * (Number(r.monthlyCost || 0))), 0) / totalCost)
    : Math.round(rows.reduce((s, r) => s + r.progressPercent, 0) / Math.max(rows.length, 1))
  return Math.max(0, Math.min(100, stackProgress))
}

export async function getLatestMetricsForUser(admin: SupabaseLike, userId: string, userTimezone?: string | null): Promise<LatestMetrics> {
  // Pull latest by local_date
  const { data: row } = await admin
    .from('daily_entries')
    .select('local_date, energy, focus, sleep, sleep_quality, mood')
    .eq('user_id', userId)
    .order('local_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!row) return null
  const localDate = String((row as any).local_date).slice(0,10)
  // Consider "recent" if within last 7 days
  try {
    const now = new Date()
    const then = new Date(`${localDate}T00:00:00`)
    const diffDays = Math.floor((now.getTime() - then.getTime()) / (24 * 60 * 60 * 1000))
    if (diffDays > 7) return null
  } catch {}
  return {
    energy: (row as any).energy ?? undefined,
    focus: (row as any).focus ?? undefined,
    sleep: ((row as any).sleep_quality ?? (row as any).sleep) ?? undefined,
    mood: (row as any).mood ?? undefined
  }
}




