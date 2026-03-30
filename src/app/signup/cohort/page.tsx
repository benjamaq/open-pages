'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clearDraft } from '@/lib/onboarding/draft'
import { fireMetaEvent, attachAttributionToParams } from '@/lib/analytics'
import {
  getCohortCookie,
  setCohortCookie,
  clearCohortCookie,
  getCohortBrandCookie,
  COHORT_QUALIFICATION_STORAGE_KEY,
  type CohortQualificationDraftV1,
} from '@/lib/cohort'

const inputCls =
  'w-full rounded-md border border-gray-200 bg-white px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400'

function readQualDraft(): CohortQualificationDraftV1 | null {
  try {
    const raw = sessionStorage.getItem(COHORT_QUALIFICATION_STORAGE_KEY)
    if (!raw) return null
    const j = JSON.parse(raw) as CohortQualificationDraftV1
    if (!j || j.v !== 1 || !String(j.cohortSlug || '').trim() || !String(j.issue || '').trim()) return null
    return j
  } catch {
    return null
  }
}

/** Placeholder until real DoNotAge logo asset ships. */
function DonotageLogoPlaceholder() {
  return (
    <div
      className="inline-flex items-center gap-3 rounded-lg border border-white/25 bg-white/10 px-3 py-2 backdrop-blur-sm"
      aria-label="DoNotAge (placeholder logo)"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/90 text-sm font-bold tracking-tight text-slate-800">
        DNA
      </div>
      <span className="text-lg font-semibold tracking-tight text-white drop-shadow-sm">DoNotAge</span>
    </div>
  )
}

function isDonotageBrandedStudy(slug: string | null, brandLabel: string | null): boolean {
  if ((slug || '').toLowerCase() === 'donotage-suresleep') return true
  const norm = (brandLabel || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
  return norm === 'donotage'
}

export default function CohortSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-neutral-600">Loading…</div>}>
      <CohortSignupInner />
    </Suspense>
  )
}

function CohortSignupInner() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [cohortSlug, setCohortSlug] = useState<string | null>(null)
  const [qualificationIssue, setQualificationIssue] = useState<string>('')
  const [cohortBrandLabel, setCohortBrandLabel] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shippingLine1, setShippingLine1] = useState('')
  const [shippingLine2, setShippingLine2] = useState('')
  const [shippingCity, setShippingCity] = useState('')
  const [shippingRegion, setShippingRegion] = useState('')
  const [shippingPostal, setShippingPostal] = useState('')
  const [shippingCountry, setShippingCountry] = useState('')
  const [reminderSlot, setReminderSlot] = useState<'morning' | 'midday' | 'evening'>('morning')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingAccountPath, setExistingAccountPath] = useState(false)

  useEffect(() => {
    const draft = readQualDraft()
    if (!draft) {
      const c = getCohortCookie()
      router.replace(c ? `/study/${encodeURIComponent(c)}` : '/')
      return
    }
    setQualificationIssue(draft.issue)
    const slug = String(draft.cohortSlug).trim().toLowerCase()
    setCohortSlug(slug)
    try {
      setCohortCookie(slug)
    } catch {}
    try {
      setCohortBrandLabel(getCohortBrandCookie())
    } catch {
      setCohortBrandLabel(null)
    }
    setReady(true)
  }, [router])

  const showDonotageLogo = isDonotageBrandedStudy(cohortSlug, cohortBrandLabel)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setExistingAccountPath(false)
    setLoading(true)
    const detectedTz = (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      } catch {
        return 'UTC'
      }
    })()
    const slug = cohortSlug || String(readQualDraft()?.cohortSlug || '').trim().toLowerCase()
    const issueText = qualificationIssue.trim() || String(readQualDraft()?.issue || '').trim()
    if (!slug || !issueText) {
      setError('Session expired. Go back to the study page to apply again.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const cleanEmail = email.trim()
      const cleanName = name.trim()
      const firstName = cleanName.split(' ')[0] || cleanName
      const { data, error: signErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            first_name: firstName,
            reminder_enabled: true,
            reminder_time: reminderSlot === 'midday' ? '12:00' : reminderSlot === 'evening' ? '19:00' : '08:00',
            reminder_timezone: detectedTz,
          },
        },
      })
      if (signErr) {
        const em = String(signErr.message || '').toLowerCase()
        if (
          em.includes('already registered') ||
          em.includes('already been registered') ||
          em.includes('user already exists') ||
          em.includes('email address is already registered')
        ) {
          setExistingAccountPath(true)
          setError(null)
        } else {
          setError(signErr.message)
        }
        setLoading(false)
        return
      }

      if (!data?.user?.id) {
        setError('We could not finish signup. If email confirmation is required, complete that step and try signing in.')
        setLoading(false)
        return
      }

      try {
        if (typeof window !== 'undefined' && (window as any).fbq) {
          ;(window as any).fbq('track', 'CompleteRegistration')
        } else {
          const pixelId = '704287959370274'
          const img = new Image()
          img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=CompleteRegistration&dl=${encodeURIComponent(window.location.href)}&ts=${Date.now()}`
        }
      } catch {}
      try {
        const attrib = attachAttributionToParams({})
        fireMetaEvent('CompleteRegistration', attrib, {
          email: cleanEmail,
          firstName: cleanName.split(' ')[0] || undefined,
          lastName: cleanName.split(' ').slice(1).join(' ') || undefined,
          externalId: data.user.id,
        }).catch(() => {})
      } catch {}

      {
        const apiBody: Record<string, unknown> = {
          user_id: data.user.id,
          name: cleanName,
          email: cleanEmail,
          timezone: detectedTz,
          cohort_id: slug,
          qualification_response: issueText,
          reminder_slot: reminderSlot,
          shipping_address_line1: shippingLine1.trim(),
          shipping_address_line2: shippingLine2.trim() || null,
          shipping_city: shippingCity.trim(),
          shipping_region: shippingRegion.trim(),
          shipping_postal_code: shippingPostal.trim(),
          shipping_country: shippingCountry.trim(),
        }
        const pr = await fetch('/api/profiles', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiBody),
        })
        if (!pr.ok) {
          const j = await pr.json().catch(() => ({} as { error?: string }))
          setError(String((j as any)?.error || 'Could not save your profile. Try again or contact support.'))
          setLoading(false)
          return
        }
        // Belt-and-suspenders: when email confirmation is off, session exists — ensure cohort_id + participant via authed API.
        try {
          const { data: sessWrap } = await supabase.auth.getSession()
          if (sessWrap?.session) {
            await fetch('/api/cohort/complete-pending-enrollment', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cohort_slug: slug }),
            })
          }
        } catch {}
        try {
          sessionStorage.removeItem(COHORT_QUALIFICATION_STORAGE_KEY)
        } catch {}
        try {
          clearCohortCookie()
        } catch {}
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
      setLoading(false)
      return
    }

    setLoading(false)
    try {
      clearDraft()
    } catch {}
    await new Promise(r => setTimeout(r, 400))
    router.push('/dashboard?checkin=1')
  }

  if (!ready || !cohortSlug) {
    return <div className="min-h-screen grid place-items-center text-neutral-600">Loading…</div>
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/pill-bottle.png')" }}
        aria-hidden
      />
      <div className="fixed inset-0 bg-black/40" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[560px] flex-col justify-center px-5 py-10 sm:px-6">
        {showDonotageLogo && (
          <div className="mb-5 sm:mb-6">
            <DonotageLogoPlaceholder />
          </div>
        )}
        <div className="w-full rounded-2xl border border-white/20 bg-white p-8 shadow-xl sm:p-10">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900">You&apos;re almost in</h1>
            <p className="mt-2 text-base text-gray-600 leading-snug">
              Tell us where to send your product and when to remind you. Your first check-in takes 30 seconds.
            </p>
          </div>
          <form onSubmit={onSubmit} className="mt-8 max-h-[min(72vh,760px)] space-y-6 overflow-y-auto pr-1">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-800">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-800">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setExistingAccountPath(false)
                }}
                className={inputCls}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-800">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                required
                minLength={8}
              />
              <p className="text-sm text-gray-500">At least 8 characters.</p>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-8">
              <p className="text-sm font-medium text-gray-800">Shipping address</p>
              <p className="text-sm leading-relaxed text-gray-500">
                We need your address to send you the product before the study begins. Your details are never shared or
                used for marketing.
              </p>
              <div className="grid gap-4">
                <input
                  type="text"
                  autoComplete="address-line1"
                  value={shippingLine1}
                  onChange={(e) => setShippingLine1(e.target.value)}
                  placeholder="Street address"
                  className={inputCls}
                  required
                />
                <input
                  type="text"
                  autoComplete="address-line2"
                  value={shippingLine2}
                  onChange={(e) => setShippingLine2(e.target.value)}
                  placeholder="Apt / suite (optional)"
                  className={inputCls}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    autoComplete="address-level2"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="City"
                    className={inputCls}
                    required
                  />
                  <input
                    type="text"
                    autoComplete="address-level1"
                    value={shippingRegion}
                    onChange={(e) => setShippingRegion(e.target.value)}
                    placeholder="State / region"
                    className={inputCls}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    autoComplete="postal-code"
                    value={shippingPostal}
                    onChange={(e) => setShippingPostal(e.target.value)}
                    placeholder="Postal code"
                    className={inputCls}
                    required
                  />
                  <input
                    type="text"
                    autoComplete="country-name"
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    placeholder="Country"
                    className={inputCls}
                    required
                  />
                </div>
              </div>
            </div>

            <fieldset className="space-y-4 border-t border-gray-100 pt-8">
              <legend className="text-sm font-medium text-gray-800">When would you like your daily reminder?</legend>
              <div className="mt-1 flex flex-col gap-3 text-base text-gray-700">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="reminder"
                    checked={reminderSlot === 'morning'}
                    onChange={() => setReminderSlot('morning')}
                    className="h-4 w-4"
                  />
                  Morning
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="reminder"
                    checked={reminderSlot === 'midday'}
                    onChange={() => setReminderSlot('midday')}
                    className="h-4 w-4"
                  />
                  Midday
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="reminder"
                    checked={reminderSlot === 'evening'}
                    onChange={() => setReminderSlot('evening')}
                    className="h-4 w-4"
                  />
                  Evening
                </label>
              </div>
            </fieldset>

            {existingAccountPath && cohortSlug && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-medium">You already have a BioStackr account. Sign in to join this study.</p>
                <Link
                  href={`/login?join_cohort=1&redirect=${encodeURIComponent('/dashboard?checkin=1')}&cohort_slug=${encodeURIComponent(cohortSlug)}`}
                  className="mt-3 inline-block font-semibold text-[#6A3F2B] hover:underline"
                >
                  Sign in to join this study →
                </Link>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-slate-900 px-4 py-3.5 text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create account & open check-in'}
            </button>
            <p className="text-center text-sm leading-relaxed text-gray-500">
              Your data is kept private and used only for this study. We never sell or share your information.
            </p>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <Link href={`/study/${encodeURIComponent(cohortSlug)}`} className="hover:underline" style={{ color: '#6A3F2B' }}>
              ← Back to study
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
