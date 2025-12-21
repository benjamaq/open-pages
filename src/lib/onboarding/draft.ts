'use client'

export type OnboardingSupplementDraft = {
  productId: string | null
  brandName: string
  name: string
  doseUnit: string
  dosePerServing?: number
  dailyDose: number
  daysPerWeek: number
  pricePerContainer?: number
  servingsPerContainer?: number
  monthlyCost?: number
  primaryGoals: string[]
  imageUrl?: string
  productUrl?: string
}

export type OnboardingDraft = {
  supplements: OnboardingSupplementDraft[]
}

const KEY = 'biostackr_onboarding_draft_v1'

export function readDraft(): OnboardingDraft {
  if (typeof window === 'undefined') return { supplements: [] }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { supplements: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.supplements)) return { supplements: [] }
    return parsed as OnboardingDraft
  } catch {
    return { supplements: [] }
  }
}

export function writeDraft(update: OnboardingDraft) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(update))
  } catch {}
}

export function updateDraft(mutator: (d: OnboardingDraft) => OnboardingDraft) {
  const current = readDraft()
  const next = mutator(current)
  writeDraft(next)
  return next
}

export function clearDraft() {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(KEY) } catch {}
}


