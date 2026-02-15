type OuraDaily = {
  date: string
  sleep_score?: number | null
  readiness_score?: number | null
  activity_score?: number | null
  steps?: number | null
  total_sleep_seconds?: number | null
  deep_sleep_seconds?: number | null
  rem_sleep_seconds?: number | null
  light_sleep_seconds?: number | null
  resting_hr_bpm?: number | null
  respiratory_rate?: number | null
  skin_temp_deviation?: number | null
  sleep_efficiency?: number | null
}

function toISODate(d: any): string | null {
  if (!d) return null
  const s = String(d)
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  try {
    const dt = new Date(s)
    if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  } catch {}
  return null
}

function num(v: any): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function detectOuraJSON(parsed: any): boolean {
  if (!parsed) return false
  // Format 1: object with arrays { sleep: [...], readiness: [...], activity: [...] }
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.sleep) || Array.isArray(parsed.readiness) || Array.isArray(parsed.activity)) return true
  }
  // Format 3/V2: array of objects with Day/day + ReadinessScore/etc.
  if (Array.isArray(parsed) && parsed.length > 0) {
    const x = parsed[0] || {}
    if ((x.Day || x.day) && (x.ReadinessScore || x.readiness_score || x.AverageHrv || x.TotalSleepDuration || x.SleepScore)) return true
  }
  return false
}

// Very lightweight CSV split (good enough for Oura Trends export; not a full RFC4180 parser).
function splitCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQ = !inQ
      continue
    }
    if (ch === ',' && !inQ) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out.map(s => s.trim())
}

export function detectOuraCSV(headers: string[]): boolean {
  const h = headers.map(x => String(x || '').toLowerCase().trim())
  return (
    h.includes('sleep score') ||
    h.includes('readiness score') ||
    h.includes('activity score') ||
    (h.includes('average hrv') && (h.includes('average resting heart rate') || h.includes('average resting hr')))
  )
}

export function parseOuraJSON(parsed: any): OuraDaily[] {
  const byDate = new Map<string, OuraDaily>()

  const upsert = (d: string, patch: Partial<OuraDaily>) => {
    const prev = byDate.get(d) || { date: d }
    byDate.set(d, { ...prev, ...patch, date: d })
  }

  // Format 1: { sleep: [...], readiness: [...], activity: [...] }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const sleepArr: any[] = Array.isArray(parsed.sleep) ? parsed.sleep : []
    const readinessArr: any[] = Array.isArray(parsed.readiness) ? parsed.readiness : []
    const activityArr: any[] = Array.isArray(parsed.activity) ? parsed.activity : []

    for (const s of sleepArr) {
      const d = toISODate(s?.summary_date || s?.day || s?.Day)
      if (!d) continue
      upsert(d, {
        sleep_score: num(s?.score),
        total_sleep_seconds: num(s?.duration),
        deep_sleep_seconds: num(s?.deep),
        rem_sleep_seconds: num(s?.rem),
        light_sleep_seconds: num(s?.light),
        resting_hr_bpm: num(s?.hr_average),
        respiratory_rate: num(s?.breath_average),
        skin_temp_deviation: num(s?.temperature_delta),
        sleep_efficiency: num(s?.efficiency),
      })
    }
    for (const r of readinessArr) {
      const d = toISODate(r?.summary_date || r?.day || r?.Day)
      if (!d) continue
      upsert(d, { readiness_score: num(r?.score) })
    }
    for (const a of activityArr) {
      const d = toISODate(a?.summary_date || a?.day || a?.Day)
      if (!d) continue
      upsert(d, { activity_score: num(a?.score), steps: num(a?.steps) })
    }
    return Array.from(byDate.values())
  }

  // Format 3/V2: array of daily objects
  if (Array.isArray(parsed)) {
    for (const it of parsed) {
      const d = toISODate(it?.summary_date || it?.day || it?.Day || it?.date)
      if (!d) continue
      upsert(d, {
        sleep_score: num(it?.SleepScore ?? it?.sleep_score ?? it?.sleepScore),
        readiness_score: num(it?.ReadinessScore ?? it?.readiness_score ?? it?.readinessScore),
        activity_score: num(it?.ActivityScore ?? it?.activity_score ?? it?.activityScore),
        steps: num(it?.steps ?? it?.Steps),
        total_sleep_seconds: num(it?.TotalSleepDuration ?? it?.total_sleep_duration ?? it?.duration),
        deep_sleep_seconds: num(it?.DeepSleepDuration ?? it?.deep),
        rem_sleep_seconds: num(it?.RemSleepDuration ?? it?.rem),
        light_sleep_seconds: num(it?.LightSleepDuration ?? it?.light),
        resting_hr_bpm: num(it?.AverageRestingHeartRate ?? it?.resting_hr_bpm ?? it?.hr_average),
        respiratory_rate: num(it?.RespiratoryRate ?? it?.breath_average),
      })
    }
    return Array.from(byDate.values())
  }

  return []
}

export function parseOuraCSV(text: string): OuraDaily[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim())

  const idx = (name: string) => headers.findIndex(h => h === name || h.includes(name))
  const iDate = idx('date')
  const iSleep = headers.indexOf('sleep score')
  const iReadiness = headers.indexOf('readiness score')
  const iActivity = headers.indexOf('activity score')
  const iSteps = idx('steps')
  const iAvgHRV = idx('average hrv')
  const iAvgRHR = idx('average resting')
  const iTotalSleep = idx('total sleep')
  const iDeep = idx('deep sleep')
  const iRem = idx('rem sleep')
  const iLight = idx('light sleep')

  if (iDate === -1) return []

  const byDate = new Map<string, OuraDaily>()
  const upsert = (d: string, patch: Partial<OuraDaily>) => {
    const prev = byDate.get(d) || { date: d }
    byDate.set(d, { ...prev, ...patch, date: d })
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i])
    const d = toISODate(parts[iDate])
    if (!d) continue
    upsert(d, {
      sleep_score: iSleep >= 0 ? num(parts[iSleep]) : null,
      readiness_score: iReadiness >= 0 ? num(parts[iReadiness]) : null,
      activity_score: iActivity >= 0 ? num(parts[iActivity]) : null,
      steps: iSteps >= 0 ? num(parts[iSteps]) : null,
      resting_hr_bpm: iAvgRHR >= 0 ? num(parts[iAvgRHR]) : null,
      // Note: Some trend exports contain HRV/RHR/sleep durations in seconds; we keep as-is if numeric.
      total_sleep_seconds: iTotalSleep >= 0 ? num(parts[iTotalSleep]) : null,
      deep_sleep_seconds: iDeep >= 0 ? num(parts[iDeep]) : null,
      rem_sleep_seconds: iRem >= 0 ? num(parts[iRem]) : null,
      light_sleep_seconds: iLight >= 0 ? num(parts[iLight]) : null,
    })
    // If HRV is present, store it under a common key wearable-status recognizes.
    if (iAvgHRV >= 0) {
      const v = num(parts[iAvgHRV])
      if (v != null) {
        const prev = byDate.get(d) || { date: d }
        ;(prev as any).hrv_ms = v
        byDate.set(d, prev)
      }
    }
  }

  return Array.from(byDate.values())
}


