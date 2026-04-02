'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useB2cCapacityModal } from '@/app/components/B2cCapacityProvider'
import { B2cCapacityWaitlistPanel } from '@/app/components/B2cCapacityWaitlistPanel'
import { toast } from 'sonner'
import { HEALTH_PRIORITIES } from '@/lib/types'
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar'

type Step = 'pick' | 'cost_goals' | 'timeline' | 'confirm'

interface Product {
  id: string
  productName: string
  brandName: string
  canonicalSupplementId: string
  pricePerContainerDefault: number
  servingsPerContainerDefault: number
  dosePerServingAmountDefault: number
  dosePerServingUnitDefault: string
}

type SelectedProduct = Product & { isCustom?: boolean }
type IntakePeriod = { startedAt: string; stoppedAt: string }

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function truncate(s: string, max: number) {
  const str = String(s || '')
  if (str.length <= max) return str
  return str.slice(0, Math.max(0, max - 1)).trimEnd() + '…'
}

function isRealNameCandidate(name?: string | null) {
  const s0 = String(name || '').trim()
  if (!s0) return false
  const s = s0.replace(/\s+/g, ' ')
  if (s.length < 3 || s.length > 24) return false
  if (s.includes('@')) return false
  if (/\d/.test(s)) return false
  // allow letters, spaces, hyphen, apostrophe
  if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(s)) return false

  const lower = s.toLowerCase()
  // Must contain at least one vowel
  const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y'])
  let vowelCount = 0
  let letterCount = 0
  let maxConsonantRun = 0
  let consonantRun = 0
  let maxRepeatRun = 0
  let repeatRun = 1
  let prev = ''
  for (const ch of lower) {
    if (ch === ' ' || ch === '-' || ch === "'") {
      consonantRun = 0
      prev = ''
      continue
    }
    letterCount++
    const isVowel = vowels.has(ch)
    if (isVowel) {
      vowelCount++
      consonantRun = 0
    } else {
      consonantRun++
      maxConsonantRun = Math.max(maxConsonantRun, consonantRun)
    }
    if (ch === prev) {
      repeatRun++
      maxRepeatRun = Math.max(maxRepeatRun, repeatRun)
    } else {
      repeatRun = 1
      prev = ch
    }
  }
  if (letterCount <= 0) return false
  if (vowelCount <= 0) return false
  // Reject "random string" patterns: too few vowels or long consonant runs / repeats
  const vowelRatio = vowelCount / letterCount
  if (vowelRatio < 0.2) return false
  if (maxConsonantRun >= 4) return false
  if (maxRepeatRun >= 3) return false

  // Avoid weird casing (lots of caps). We'll capitalize display anyway.
  const extraCaps = s.slice(1).replace(/[^A-Z]/g, '')
  if (extraCaps.length >= 2) return false

  return true
}

function capitalizeFirst(s: string) {
  const v = String(s || '').trim()
  if (!v) return v
  return v.slice(0, 1).toUpperCase() + v.slice(1)
}

function extractShortSupplementName(fullTitle: string, fallback: string) {
  const raw = String(fullTitle || '').trim()
  if (!raw) return truncate(fallback, 30)
  const lower = raw.toLowerCase()

  const known = [
    'magnesium',
    'creatine',
    'omega-3',
    'omega 3',
    'vitamin d',
    'ashwagandha',
    'melatonin',
    'probiotic',
    'krill oil',
    'fish oil',
  ]

  const kw = known.find(k => lower.includes(k))
  if (kw) {
    const idx = lower.indexOf(kw)
    const tail = raw.slice(idx)
    // Take keyword + up to 2 following words (stop on punctuation)
    const cleaned = tail.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
    const words = cleaned.split(' ')
    const take = words.slice(0, Math.min(words.length, kw.includes(' ') ? 3 : 3)).join(' ')
    return truncate(take, 30)
  }

  // If it looks like "Brand, Something Useful, ..." choose the best segment.
  if (raw.includes(',')) {
    const parts = raw.split(',').map(p => p.trim()).filter(Boolean)
    const a = parts[0] || ''
    const b = parts[1] || ''
    const brandHint = /(nutrition|labs|lab|pharma|company|co\.|inc\.|ltd\.|gold|california|now foods|thorne|life extension|himalaya)/i
    const containsKnown = (s: string) => known.some(k => String(s || '').toLowerCase().includes(k))
    // Prefer the segment that looks like the supplement name, not a flavor/packaging descriptor.
    const bLooksLikeDescriptor = /(unflavored|flavor|capsules|caplets|tablets|softgels|gummies|powder|veg|vegetarian|count|ct|pack|servings)/i.test(b)
    if (b && containsKnown(b) && (!containsKnown(a) || brandHint.test(a))) return truncate(b, 30)
    if (a && !brandHint.test(a)) return truncate(a, 30)
    if (b && !bLooksLikeDescriptor) return truncate(b, 30)
    return truncate(a || b, 30)
  }

  // Otherwise, take up to first "(" or " - "
  const cutIdx = (() => {
    const a = raw.indexOf('(')
    const b = raw.indexOf(' - ')
    const cands = [a, b].filter(x => x >= 0)
    return cands.length > 0 ? Math.min(...cands) : -1
  })()
  const base = cutIdx >= 0 ? raw.slice(0, cutIdx).trim() : raw
  return truncate(base, 30)
}

export default function OnboardingPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { atCapacity: b2cCapacityGate } = useB2cCapacityModal()
  const [b2cOnboardingReady, setB2cOnboardingReady] = useState(!b2cCapacityGate)
  const [b2cOnboardingBlocked, setB2cOnboardingBlocked] = useState(false)

  useEffect(() => {
    if (!b2cCapacityGate) return
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (cancelled) return
        setB2cOnboardingBlocked(!data?.user)
      } catch {
        if (!cancelled) setB2cOnboardingBlocked(true)
      } finally {
        if (!cancelled) setB2cOnboardingReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [b2cCapacityGate])

  // Fire Meta Pixel CompleteRegistration when landing from signup (justSignedUp set before redirect)
  useEffect(() => {
    try {
      const flag = typeof window !== 'undefined' ? sessionStorage.getItem('justSignedUp') : null
      if (flag) {
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'CompleteRegistration')
          try { console.log('✅ Meta Pixel: CompleteRegistration fired (signup→onboarding)') } catch {}
        }
        sessionStorage.removeItem('justSignedUp')
      }
    } catch {}
  }, [])

  const [step, setStep] = useState<Step>('pick')

  const [addedCount, setAddedCount] = useState<number>(0)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  const [showWelcomeLine, setShowWelcomeLine] = useState<boolean>(true)

  // Step 1: pick supplement
  const [quickPickActive, setQuickPickActive] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)

  // Step 2: cost + goals
  const [monthlyCostInput, setMonthlyCostInput] = useState<string>('') // EMPTY by default
  const [showAdvancedPricing, setShowAdvancedPricing] = useState<boolean>(false)
  const [containerPriceInput, setContainerPriceInput] = useState<string>('')
  const [unitsPerContainerInput, setUnitsPerContainerInput] = useState<string>('')
  const [servingsPerDayInput, setServingsPerDayInput] = useState<string>('1')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [goalNotSure, setGoalNotSure] = useState<boolean>(false)
  const [showMoreGoals, setShowMoreGoals] = useState<boolean>(false)

  // Step 3: timeline (+ save on Add to stack)
  const [startedAt, setStartedAt] = useState<string>('') // YYYY-MM-DD
  const [isActive, setIsActive] = useState<boolean>(true)
  const [stoppedAt, setStoppedAt] = useState<string>('')
  const [showAdvancedTimeline, setShowAdvancedTimeline] = useState<boolean>(false)
  const [dailyDose, setDailyDose] = useState<number>(1)
  const [doseUnit, setDoseUnit] = useState<string>('mg')
  const [timeOfDay, setTimeOfDay] = useState<Array<'morning' | 'afternoon' | 'evening' | 'night'>>([])
  const [scheduleType, setScheduleType] = useState<'every_day' | 'weekdays' | 'weekends' | 'as_needed'>('every_day')
  const [intakePeriods, setIntakePeriods] = useState<IntakePeriod[]>([])
  const [saving, setSaving] = useState<boolean>(false)

  // Step 4: confirmation
  const [lastAddedShortName, setLastAddedShortName] = useState<string>('')

  const uuid = () => {
    try {
      const v = (crypto as any)?.randomUUID?.()
      if (v) return String(v)
    } catch {}
    return `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`
  }

  const goalsAll = useMemo(() => HEALTH_PRIORITIES.map(p => ({ key: String(p.key), label: String(p.label) })), [])
  const firstSixGoalKeys = useMemo(() => ['sleep', 'energy', 'cognitive', 'mood', 'longevity', 'immunity'], [])
  const moreGoalKeys = useMemo(() => ['gut', 'athletic', 'joint', 'beauty'], [])

  const selectedTitle = String(selectedProduct?.productName || '').trim()
  const selectedBrand = String(selectedProduct?.brandName || '').trim()
  const shortName = useMemo(() => {
    if (!selectedProduct) return ''
    if (selectedProduct.isCustom) return truncate(selectedTitle, 30)
    return extractShortSupplementName(selectedTitle, selectedTitle)
  }, [selectedProduct, selectedTitle])

  const shortNameForHeading = useMemo(() => truncate(shortName || selectedTitle || 'supplement', 30), [shortName, selectedTitle])
  const shortNameForRef = useMemo(() => truncate(shortName || selectedTitle || 'supplement', 50), [shortName, selectedTitle])

  // Pricing parse
  const monthlyCost = useMemo(() => {
    const raw = String(monthlyCostInput || '').replace(/,/g, '').replace(/^\$/, '').trim()
    if (!raw) return null
    const n = parseFloat(raw)
    if (!Number.isFinite(n)) return null
    if (n <= 0) return null
    return clamp(n, 0, 80)
  }, [monthlyCostInput])

  const containerPrice = useMemo(() => {
    const raw = String(containerPriceInput || '').replace(/,/g, '').replace(/^\$/, '').trim()
    if (!raw) return null
    const n = parseFloat(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [containerPriceInput])

  const unitsPerContainer = useMemo(() => {
    const raw = String(unitsPerContainerInput || '').replace(/,/g, '').trim()
    if (!raw) return null
    const n = parseFloat(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [unitsPerContainerInput])

  const servingsPerDay = useMemo(() => {
    const raw = String(servingsPerDayInput || '').replace(/,/g, '').trim()
    if (!raw) return 1
    const n = parseFloat(raw)
    return Number.isFinite(n) && n > 0 ? n : 1
  }, [servingsPerDayInput])

  const computedMonthlyFromAdvanced = useMemo(() => {
    if (!containerPrice || !unitsPerContainer) return null
    const monthly = (containerPrice / unitsPerContainer) * servingsPerDay * 30
    if (!Number.isFinite(monthly) || monthly <= 0) return null
    return clamp(Math.round(monthly * 100) / 100, 0, 80)
  }, [containerPrice, unitsPerContainer, servingsPerDay])

  const monthlyCostReadOnly = useMemo(() => showAdvancedPricing && computedMonthlyFromAdvanced != null, [showAdvancedPricing, computedMonthlyFromAdvanced])

  const liveCostText = useMemo(() => {
    const m = monthlyCostReadOnly && computedMonthlyFromAdvanced != null ? computedMonthlyFromAdvanced : monthlyCost
    if (m == null) return null
    const perDay = Math.round((m / 30) * 100) / 100
    const perYear = Math.round(m * 12)
    return `$${perDay.toFixed(2)}/day · $${perYear}/year`
  }, [monthlyCost, monthlyCostReadOnly, computedMonthlyFromAdvanced])

  const step1Ready = useMemo(() => Boolean(selectedProduct && String(selectedProduct.productName || '').trim()), [selectedProduct])

  const step2Ready = useMemo(() => {
    if (goalNotSure) return true
    return selectedGoals.length > 0
  }, [goalNotSure, selectedGoals.length])

  const timingLabel = useMemo(() => {
    if (!timeOfDay || timeOfDay.length === 0) return ''
    if (timeOfDay.includes('morning')) return 'Morning'
    if (timeOfDay.includes('afternoon')) return 'Afternoon'
    if (timeOfDay.includes('evening')) return 'Evening'
    if (timeOfDay.includes('night')) return 'Before bed'
    return ''
  }, [timeOfDay])

  const doseText = useMemo(() => {
    const unitRaw = String(doseUnit || '').trim()
    const unitNorm = (() => {
      const lc = unitRaw.toLowerCase()
      if (!lc) return ''
      if (lc === 'capsule' || lc === 'capsules') return 'caps'
      if (lc === 'iu') return 'IU'
      return lc
    })()
    const amt = Number(dailyDose || 0)
    const amtText = Number.isFinite(amt) && amt > 0 ? String(Math.round(amt * 100) / 100) : ''
    return `${amtText}${unitNorm ? (unitNorm === 'IU' ? ' IU' : ` ${unitNorm}`) : ''}`.trim()
  }, [dailyDose, doseUnit])

  const frequency = useMemo(() => {
    if (scheduleType === 'weekdays') return 'weekdays'
    if (scheduleType === 'weekends') return 'weekends'
    if (scheduleType === 'as_needed') return 'as_needed'
    return 'daily'
  }, [scheduleType])

  // Refresh-safe supplement count seed
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/supplements', { cache: 'no-store', credentials: 'include' })
        if (!mounted) return
        if (r.ok) {
          const j = await r.json().catch(() => ([] as any[]))
          setAddedCount(Array.isArray(j) ? j.length : 0)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  // Personalisation name (first visit only)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store', credentials: 'include' })
        if (!mounted) return
        if (r.ok) {
          const j = await r.json()
          const nm = (j?.firstName && String(j.firstName)) || null
          setWelcomeName(isRealNameCandidate(nm) ? capitalizeFirst(String(nm || '')) : null)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  // Debounced iHerb-backed search
  useEffect(() => {
    if (selectedProduct) return
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/supplements/search?q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' })
        const data = await res.json()
        const rows = Array.isArray(data?.results) ? data.results : []
        const mapped: Product[] = rows.map((row: any) => {
          const servings = Number(row.servings_per_container ?? 0) || 0
          const pricePerServing = Number(row.price_per_serving ?? 0) || 0
          const pricePerContainer = servings > 0 ? pricePerServing * servings : 0
          return {
            id: String(row.id),
            productName: String(row.title ?? ''),
            brandName: String(row.brand ?? ''),
            canonicalSupplementId: String(row.id),
            pricePerContainerDefault: pricePerContainer,
            servingsPerContainerDefault: servings,
            dosePerServingAmountDefault: 1,
            dosePerServingUnitDefault: 'capsules',
          }
        })
        setSearchResults(mapped)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedProduct])

  // Step 3 default start date (fast path)
  useEffect(() => {
    if (step !== 'timeline') return
    if (startedAt) return
    try { setStartedAt(new Date().toISOString().slice(0, 10)) } catch {}
  }, [step, startedAt])

  // Step 2: prefill monthly cost from iHerb price (only if empty and price exists)
  useEffect(() => {
    if (step !== 'cost_goals') return
    if (!selectedProduct) return
    if (selectedProduct.isCustom) return
    if (String(monthlyCostInput || '').trim()) return
    const p = Number(selectedProduct.pricePerContainerDefault || 0)
    if (!Number.isFinite(p) || p <= 0) return
    setMonthlyCostInput(String(Math.round(p * 100) / 100))
  }, [step, selectedProduct, monthlyCostInput])

  // If advanced pricing is open and fully computed, reflect it into the main monthly cost field.
  useEffect(() => {
    if (!showAdvancedPricing) return
    if (computedMonthlyFromAdvanced == null) return
    setMonthlyCostInput(String(computedMonthlyFromAdvanced))
  }, [showAdvancedPricing, computedMonthlyFromAdvanced])

  // If user starts typing a manual monthly cost while advanced pricing is open, close advanced and clear it (avoid conflicts).
  useEffect(() => {
    if (!showAdvancedPricing) return
    if (monthlyCostReadOnly) return
    // Any non-empty manual entry means we shouldn't keep advanced fields around.
    if (!String(monthlyCostInput || '').trim()) return
    setShowAdvancedPricing(false)
    setContainerPriceInput('')
    setUnitsPerContainerInput('')
    setServingsPerDayInput('1')
  }, [monthlyCostInput, monthlyCostReadOnly, showAdvancedPricing])

  function clearAllFieldsForLoop() {
    setQuickPickActive(null)
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
    setSelectedProduct(null)

    setMonthlyCostInput('')
    setShowAdvancedPricing(false)
    setContainerPriceInput('')
    setUnitsPerContainerInput('')
    setServingsPerDayInput('1')
    setSelectedGoals([])
    setGoalNotSure(false)
    setShowMoreGoals(false)

    setStartedAt('')
    setIsActive(true)
    setStoppedAt('')
    setShowAdvancedTimeline(false)
    setDailyDose(1)
    setDoseUnit('mg')
    setTimeOfDay([])
    setScheduleType('every_day')
    setIntakePeriods([])
    setSaving(false)

    setLastAddedShortName('')

    try { inputRef.current?.focus() } catch {}
  }

  function toggleGoal(key: string) {
    if (goalNotSure) return
    setSelectedGoals(prev => prev.includes(key) ? prev.filter(x => x !== key) : prev.length < 2 ? [...prev, key] : prev)
  }

  async function persistSelectedSupplement() {
    if (!selectedProduct) return { ok: false as const, error: 'No supplement selected' }
    const name = String(selectedProduct.productName || '').trim()
    if (!name) return { ok: false as const, error: 'Name required' }
    if (!startedAt) return { ok: false as const, error: 'Start date required' }
    if (isActive === false && !stoppedAt) return { ok: false as const, error: 'End date required' }

    const monthly = monthlyCostReadOnly && computedMonthlyFromAdvanced != null ? computedMonthlyFromAdvanced : monthlyCost

    const payload: any = {
      name,
      monthly_cost_usd: monthly == null ? 0 : clamp(Number(monthly || 0), 0, 80),
      primary_goal_tags: goalNotSure ? [] : (Array.isArray(selectedGoals) ? selectedGoals : []),
      ...(doseText ? { dose: doseText } : {}),
      ...(timingLabel ? { timing: timingLabel, time_of_day: timingLabel } : {}),
      ...(frequency ? { frequency } : {}),
      ...(String(selectedProduct.brandName || '').trim() ? { brand: String(selectedProduct.brandName || '').trim() } : {}),
      startDate: String(startedAt).slice(0, 10),
      ...(isActive === false && stoppedAt ? { endDate: String(stoppedAt).slice(0, 10) } : {}),
    }

    const create = await fetch('/api/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const created = await create.json().catch(() => ({} as any))
    if (!create.ok || !created?.id) {
      return { ok: false as const, error: String(created?.error || 'Failed to add supplement') }
    }

    const periodsToCreate: Array<{ start_date: string; end_date: string | null }> = []
    periodsToCreate.push({
      start_date: String(startedAt).slice(0, 10),
      end_date: isActive === false && stoppedAt ? String(stoppedAt).slice(0, 10) : null,
    })
    for (const p of intakePeriods || []) {
      const s = String(p?.startedAt || '').slice(0, 10)
      if (!s) continue
      const e = String(p?.stoppedAt || '').slice(0, 10)
      periodsToCreate.push({ start_date: s, end_date: e ? e : null })
    }
    for (const period of periodsToCreate) {
      try {
        await fetch(`/api/supplements/${encodeURIComponent(String(created.id))}/periods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(period),
        })
      } catch {}
    }
    return { ok: true as const, id: String(created.id) }
  }

  if (b2cCapacityGate && !b2cOnboardingReady) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 text-sm text-neutral-600">
        Loading…
      </div>
    )
  }

  if (b2cCapacityGate && b2cOnboardingBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-neutral-50">
        <B2cCapacityWaitlistPanel variant="page" showNavLinks headingId="b2c-onboarding-waitlist-heading" />
        <p className="mt-8 text-sm text-neutral-600">
          Already started?{' '}
          <Link className="text-[#6A3F2B] underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/supps.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative z-10 max-w-[760px] mx-auto px-4 py-8 sm:px-6 sm:py-16">
        <div className="rounded-2xl bg-white/95 shadow-sm ring-1 ring-black/[0.04] p-4 sm:p-10 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-none overflow-hidden sm:overflow-visible">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden sm:overflow-visible pr-0 sm:pr-1">
            <div className="mb-7">
              <OnboardingProgressBar active="supplements" />
            </div>

            {/* STEP 1: Pick Supplement */}
            {step === 'pick' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  {addedCount === 0 && showWelcomeLine && (
                    <p className="text-base font-medium text-slate-600">
                      {welcomeName ? `Welcome to BioStackr, ${welcomeName}` : 'Welcome to BioStackr'}
                    </p>
                  )}
                  <h1 className="text-[34px] sm:text-[42px] font-bold text-slate-900 leading-tight">
                    {addedCount === 0 ? 'What supplement do you want to test first?' : 'Add another supplement'}
                  </h1>
                  <p className="text-lg text-slate-600">
                    {addedCount === 0
                      ? "Pick the one you're most suspicious of. We'll do the math."
                      : `${addedCount} added so far. Most users test 3–5.`}
                  </p>
                </div>

                {!selectedProduct && (
                  <>
                    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                      {['Magnesium', 'Creatine', 'Omega-3', 'Vitamin D', 'Ashwagandha', 'Melatonin', 'Probiotic'].map((name) => {
                        const selected = quickPickActive === name
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setQuickPickActive(name)
                              const q = String(name || '').trim()
                              setSearchQuery(q)
                              try { inputRef.current?.focus() } catch {}
                            }}
                            className={`shrink-0 inline-flex items-center px-4 py-2 text-sm font-medium rounded-full border transition whitespace-nowrap ${
                              selected
                                ? 'border-slate-900 text-slate-900 bg-white'
                                : 'border-slate-200 text-slate-700 bg-white hover:border-slate-400'
                            }`}
                          >
                            {name}
                          </button>
                        )
                      })}
                    </div>

                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setQuickPickActive(null)
                          setSearchQuery(e.target.value)
                        }}
                        placeholder="Search supplements (e.g. magnesium glycinate)"
                        className="w-full px-5 py-4 text-base border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                      />

                      {(isSearching || searchResults.length > 0 || searchQuery.trim().length > 0) && (
                        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                          {isSearching && (
                            <div className="px-4 py-3 text-sm text-slate-500">Searching…</div>
                          )}
                          {!isSearching && searchResults.length > 0 && (
                            <div className="max-h-[320px] overflow-y-auto">
                              {searchResults.map((p) => {
                                const price = Number(p.pricePerContainerDefault || 0)
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedProduct(p)
                                      setSearchResults([])
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div
                                          className="font-medium text-slate-900 truncate"
                                          title={p.productName}
                                        >
                                          {truncate(p.productName, 80)}
                                        </div>
                                        <div className="text-sm text-slate-500 truncate">{p.brandName}</div>
                                      </div>
                                      {Number.isFinite(price) && price > 0 && (
                                        <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                                          ${price.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const nm = String(searchQuery || '').trim()
                              if (!nm) {
                                try { toast.info('Type a supplement name first') } catch {}
                                return
                              }
                              const stub: SelectedProduct = {
                                id: uuid(),
                                productName: nm,
                                brandName: '',
                                canonicalSupplementId: '',
                                pricePerContainerDefault: 0,
                                servingsPerContainerDefault: 0,
                                dosePerServingAmountDefault: 1,
                                dosePerServingUnitDefault: 'capsules',
                                isCustom: true,
                              }
                              setSelectedProduct(stub)
                              setSearchResults([])
                            }}
                            className="w-full text-left px-4 py-3 border-t border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            + Add custom supplement
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedProduct && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {selectedProduct.isCustom ? (
                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-slate-900">Custom supplement</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="text-sm text-slate-700">
                                Supplement name
                                <input
                                  type="text"
                                  value={selectedProduct.productName}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setSelectedProduct((p0) => (p0 ? { ...p0, productName: v } : p0))
                                  }}
                                  className="mt-1 w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white"
                                />
                              </label>
                              <label className="text-sm text-slate-700">
                                Brand (optional)
                                <input
                                  type="text"
                                  value={selectedProduct.brandName || ''}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setSelectedProduct((p0) => (p0 ? { ...p0, brandName: v } : p0))
                                  }}
                                  className="mt-1 w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white"
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className="text-lg font-semibold text-slate-900 truncate"
                              title={selectedProduct.productName}
                            >
                              {truncate(selectedProduct.productName, 60)}
                            </div>
                            <div className="text-sm text-slate-600 truncate">{selectedProduct.brandName}</div>
                            {Number(selectedProduct.pricePerContainerDefault || 0) > 0 && (
                              <div className="text-sm text-slate-700 mt-1">
                                ${Number(selectedProduct.pricePerContainerDefault || 0).toFixed(2)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null)
                          setSearchQuery('')
                          setSearchResults([])
                          try { inputRef.current?.focus() } catch {}
                        }}
                        className="text-sm text-slate-600 hover:text-slate-900 underline whitespace-nowrap"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {selectedProduct && (
                  <button
                    type="button"
                    disabled={!step1Ready}
                    onClick={() => {
                      setShowWelcomeLine(false)
                      setStep('cost_goals')
                    }}
                    className={`w-full h-12 rounded-xl font-semibold transition ${
                      step1Ready ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                )}
              </div>
            )}

            {/* STEP 2: Cost + Goals */}
            {step === 'cost_goals' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-[34px] sm:text-[42px] font-bold text-slate-900 leading-tight">
                    Tell us more
                  </h1>
                  <div className="text-sm text-slate-500">
                    <span className="font-medium text-slate-600">{shortNameForRef}</span>
                    {selectedBrand ? <span> · {truncate(selectedBrand, 30)}</span> : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <div className="text-lg font-semibold text-slate-900">Monthly cost</div>
                    <div className="text-sm text-slate-500">(optional)</div>
                  </div>
                  <div className="text-sm text-slate-500">Know what you&apos;re spending. We&apos;ll calculate the rest.</div>

                  <div className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-2">
                    <div className="text-slate-500">$</div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={monthlyCostInput}
                      onChange={(e) => setMonthlyCostInput(e.target.value)}
                      placeholder={
                        selectedProduct?.isCustom || Number(selectedProduct?.pricePerContainerDefault || 0) <= 0
                          ? 'e.g. 15'
                          : ''
                      }
                      readOnly={monthlyCostReadOnly}
                      className="flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                    <div className="text-slate-500 whitespace-nowrap">/month</div>
                  </div>

                  {liveCostText && (
                    <div className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-fit">
                      {liveCostText}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowAdvancedPricing(v => {
                        const next = !v
                        setContainerPriceInput('')
                        setUnitsPerContainerInput('')
                        setServingsPerDayInput('1')
                        return next
                      })
                    }}
                    className="text-sm font-semibold text-slate-900"
                  >
                    Advanced {showAdvancedPricing ? '▾' : '▾'}
                  </button>

                  {showAdvancedPricing && (
                    <div className="mt-1 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="text-sm text-slate-700">
                          Container price
                          <div className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center gap-2">
                            <div className="text-slate-400">$</div>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={containerPriceInput}
                              onChange={(e) => setContainerPriceInput(e.target.value)}
                              placeholder="e.g. 24.99"
                              className="flex-1 min-w-0 bg-transparent outline-none"
                            />
                          </div>
                        </label>
                        <label className="text-sm text-slate-700">
                          Units per container
                          <input
                            type="text"
                            inputMode="decimal"
                            value={unitsPerContainerInput}
                            onChange={(e) => setUnitsPerContainerInput(e.target.value)}
                            placeholder="e.g. 60"
                            className="mt-1 w-full h-11 px-3 py-2 border border-slate-200 rounded-lg bg-white"
                          />
                        </label>
                        <label className="text-sm text-slate-700">
                          Servings per day
                          <input
                            type="text"
                            inputMode="decimal"
                            value={servingsPerDayInput}
                            onChange={(e) => setServingsPerDayInput(e.target.value)}
                            className="mt-1 w-full h-11 px-3 py-2 border border-slate-200 rounded-lg bg-white"
                          />
                        </label>
                      </div>
                      {computedMonthlyFromAdvanced != null && (
                        <div className="text-sm font-semibold text-slate-900">
                          ${computedMonthlyFromAdvanced.toFixed(2)}/month
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-8 mt-2 border-t border-slate-200" />

                <div className="space-y-3">
                  <div className="text-lg font-semibold text-slate-900">Why do you take this?</div>
                  <div className="text-sm text-slate-500">
                    Select up to 2. We&apos;ll analyse your full stack to show what percentage goes toward each goal.
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGoalNotSure(v => {
                          const next = !v
                          if (next) setSelectedGoals([])
                          return next
                        })
                      }}
                      className={`rounded-full px-3.5 py-2 text-sm border ${
                        goalNotSure ? 'bg-slate-50 border-slate-500 text-slate-900' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      Not sure yet — Skip for now
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {firstSixGoalKeys.map((k) => {
                      const g = goalsAll.find(x => x.key === k)
                      if (!g) return null
                      const selected = selectedGoals.includes(g.key)
                      return (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => toggleGoal(g.key)}
                          disabled={goalNotSure}
                          className={`rounded-full h-10 px-4 text-sm border transition ${
                            selected ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-slate-300 text-slate-800 bg-white hover:border-slate-500'
                          } ${goalNotSure ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {g.label}
                        </button>
                      )
                    })}
                  </div>

                  {!showMoreGoals ? (
                    <button
                      type="button"
                      onClick={() => setShowMoreGoals(true)}
                      className="text-sm text-slate-700 font-semibold underline w-fit"
                    >
                      + Show more
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {moreGoalKeys.map((k) => {
                        const g = goalsAll.find(x => x.key === k)
                        if (!g) return null
                        const selected = selectedGoals.includes(g.key)
                        return (
                          <button
                            key={g.key}
                            type="button"
                            onClick={() => toggleGoal(g.key)}
                            disabled={goalNotSure}
                            className={`rounded-full h-10 px-4 text-sm border transition ${
                              selected ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-slate-300 text-slate-800 bg-white hover:border-slate-500'
                            } ${goalNotSure ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {g.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('pick')}
                    className="h-12 w-full sm:w-auto px-5 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!step2Ready}
                    onClick={() => setStep('timeline')}
                    className={`h-12 w-full px-5 rounded-xl font-semibold transition ${
                      step2Ready ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Next: Timeline
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Timeline (save happens here) */}
            {step === 'timeline' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="text-[34px] sm:text-[42px] font-bold text-slate-900 leading-tight">
                    When did you start taking it?
                  </h1>
                  <div className="text-base text-slate-500">
                    <span className="font-medium text-slate-600" title={selectedTitle}>{shortNameForRef}</span>
                    {selectedBrand ? <span> · {truncate(selectedBrand, 30)}</span> : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <div className="font-semibold text-slate-900">Start date</div>
                    <div className="text-sm text-slate-500 mt-1">An approximate date is fine</div>
                    <input
                      type="date"
                      value={startedAt}
                      onChange={(e) => setStartedAt(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className="mt-2 w-full h-11 px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </label>

                  <div>
                    <div className="font-semibold text-slate-900">Still taking it?</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setIsActive(true)}
                        className={`h-11 px-6 rounded-full border text-sm font-semibold ${
                          isActive ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        aria-pressed={!isActive}
                        onClick={() => setIsActive(false)}
                        className={`h-11 px-6 rounded-full border text-sm font-semibold ${
                          !isActive ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {!isActive && (
                    <label className="block">
                      <div className="font-semibold text-slate-900">When did you stop?</div>
                      <input
                        type="date"
                        value={stoppedAt}
                        onChange={(e) => setStoppedAt(e.target.value)}
                        max={new Date().toISOString().slice(0, 10)}
                        className={`mt-2 w-full h-11 px-3 py-2 border rounded-lg bg-white ${stoppedAt ? 'border-slate-200' : 'border-red-300'}`}
                      />
                    </label>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvancedTimeline(v => !v)}
                  className="text-sm font-semibold text-slate-900"
                >
                  Advanced ▾
                </button>

                {showAdvancedTimeline && (
                  <div className="space-y-5">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Dose</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setDailyDose(d => Math.max(0, Number(d || 0) - 1))}
                            className="h-10 w-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                            aria-label="Decrease dose"
                          >
                            −
                          </button>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={String(dailyDose)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^\d.]/g, '')
                              const n = parseFloat(raw || '0')
                              setDailyDose(Number.isFinite(n) ? n : 0)
                            }}
                            className="h-10 w-24 px-3 py-2 border border-slate-200 rounded-lg text-center"
                          />
                          <button
                            type="button"
                            onClick={() => setDailyDose(d => Math.max(0, Number(d || 0) + 1))}
                            className="h-10 w-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                            aria-label="Increase dose"
                          >
                            +
                          </button>
                          <select
                            value={doseUnit}
                            onChange={(e) => setDoseUnit(e.target.value)}
                            className="h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="mg">mg</option>
                            <option value="g">grams</option>
                            <option value="mcg">mcg</option>
                            <option value="IU">IU</option>
                            <option value="ml">ml</option>
                            <option value="capsules">capsules</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Time of day (optional)</div>
                        <div className="flex flex-wrap gap-2">
                          {(['morning', 'afternoon', 'evening', 'night'] as const).map((t) => {
                            const selected = timeOfDay.includes(t)
                            const label = t === 'morning' ? 'Morning' : t === 'afternoon' ? 'Afternoon' : t === 'evening' ? 'Evening' : 'Night'
                            return (
                              <button
                                key={t}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setTimeOfDay(selected ? timeOfDay.filter(x => x !== t) : [...timeOfDay, t])}
                                className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
                                  selected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Frequency</div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'every_day', label: 'Every day' },
                            { key: 'weekdays', label: 'Weekdays only' },
                            { key: 'weekends', label: 'Weekends only' },
                            { key: 'as_needed', label: 'As needed' },
                          ].map((o) => {
                            const selected = scheduleType === (o.key as any)
                            return (
                              <button
                                key={o.key}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setScheduleType(o.key as any)}
                                className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
                                  selected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                              >
                                {o.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Additional periods</div>
                        <div className="mt-2 space-y-2">
                          {intakePeriods.map((p, i) => (
                            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <label className="text-sm text-slate-700">
                                  Started
                                  <input
                                    type="date"
                                    value={p.startedAt}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      setIntakePeriods(prev => prev.map((x, idx) => idx === i ? { ...x, startedAt: v } : x))
                                    }}
                                    max={new Date().toISOString().slice(0, 10)}
                                    className="mt-1 w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white"
                                  />
                                </label>
                                <label className="text-sm text-slate-700">
                                  Stopped
                                  <input
                                    type="date"
                                    value={p.stoppedAt}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      setIntakePeriods(prev => prev.map((x, idx) => idx === i ? { ...x, stoppedAt: v } : x))
                                    }}
                                    max={new Date().toISOString().slice(0, 10)}
                                    className="mt-1 w-full h-10 px-3 py-2 border border-slate-200 rounded-lg bg-white"
                                  />
                                </label>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setIntakePeriods(prev => prev.filter((_, idx) => idx !== i))}
                                  className="text-sm text-slate-600 hover:text-red-600"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIntakePeriods(prev => [...prev, { startedAt: '', stoppedAt: '' }])}
                          className="mt-3 h-10 px-4 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          + Add period
                        </button>
                      </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('cost_goals')}
                    className="h-12 w-full sm:w-auto px-5 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={
                      saving ||
                      !selectedProduct ||
                      !startedAt ||
                      (isActive === false && !stoppedAt)
                    }
                    onClick={async () => {
                      if (saving) return
                      setSaving(true)
                      try {
                        const r = await persistSelectedSupplement()
                        if (!r.ok) {
                          try { toast.error('Could not add supplement', { description: (r as any)?.error || 'Please try again.' } as any) } catch {}
                          setSaving(false)
                          return
                        }
                        setAddedCount(c => c + 1)
                        setLastAddedShortName(shortNameForHeading)
                        setSaving(false)
                        setStep('confirm')
                      } catch (e: any) {
                        setSaving(false)
                        try { toast.error('Could not add supplement', { description: e?.message || 'Please try again.' } as any) } catch {}
                      }
                    }}
                    className={`h-12 w-full px-5 rounded-xl font-semibold transition ${
                      saving ? 'bg-slate-900 text-white opacity-70 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Add to stack
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Confirmation + Loop */}
            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {lastAddedShortName ? `${lastAddedShortName} is on trial` : 'Supplement is on trial'}
                  </div>
                  <div className="text-slate-500">{addedCount} supplement{addedCount === 1 ? '' : 's'} in your stack</div>
                </div>

                <div className="text-center space-y-4">
                  <div className="text-sm text-slate-600 font-medium">Your verdict will be one of:</div>
                  <div className="mx-auto w-full max-w-[520px]">
                    <div className="grid grid-cols-[84px_1fr] gap-x-3 gap-y-2 text-left">
                      <div className="font-bold text-base text-slate-900">KEEP</div>
                      <div className="text-sm text-slate-600">— it&apos;s working, keep taking it</div>

                      <div className="font-bold text-base text-slate-900">DROP</div>
                      <div className="text-sm text-slate-600">— it&apos;s not working, stop wasting money</div>

                      <div className="font-bold text-base text-slate-900">TESTING</div>
                      <div className="text-sm text-slate-600">— we need more data</div>
                    </div>
                  </div>
                </div>

                {addedCount < 3 && (
                  <div className="text-sm text-slate-500">Most users test 3–5 supplements.</div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllFieldsForLoop()
                      setStep('pick')
                    }}
                    className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    Add another supplement
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/upload')}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold hover:bg-slate-50"
                  >
                    Next step
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

