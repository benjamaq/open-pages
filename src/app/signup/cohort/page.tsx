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
  COHORT_QUALIFICATION_STORAGE_KEY,
  type CohortQualificationDraftV1,
} from '@/lib/cohort'

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
    setReady(true)
  }, [router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
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
        setError(signErr.message)
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiBody),
        })
        if (!pr.ok) {
          const j = await pr.json().catch(() => ({} as { error?: string }))
          setError(String((j as any)?.error || 'Could not save your profile. Try again or contact support.'))
          setLoading(false)
          return
        }
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
    <div
      className="min-h-screen grid place-items-center p-6"
      style={{
        backgroundImage: "url('/sign in.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-[520px] rounded-2xl border border-gray-200 bg-white/95 p-8 sm:p-10 shadow-lg ring-1 ring-black/5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Create your study account</h1>
          <p className="mt-2 text-gray-600">Shipping and reminders — then your first check-in.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              minLength={8}
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-800">Shipping address</p>
            <div className="mt-3 grid gap-3">
              <input
                type="text"
                value={shippingLine1}
                onChange={(e) => setShippingLine1(e.target.value)}
                placeholder="Street address"
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                value={shippingLine2}
                onChange={(e) => setShippingLine2(e.target.value)}
                placeholder="Apt / suite (optional)"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="City"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
                <input
                  type="text"
                  value={shippingRegion}
                  onChange={(e) => setShippingRegion(e.target.value)}
                  placeholder="State / region"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={shippingPostal}
                  onChange={(e) => setShippingPostal(e.target.value)}
                  placeholder="Postal code"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
                <input
                  type="text"
                  value={shippingCountry}
                  onChange={(e) => setShippingCountry(e.target.value)}
                  placeholder="Country"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <fieldset className="border-t border-gray-100 pt-4">
            <legend className="text-sm font-medium text-gray-800">When would you like your daily reminder?</legend>
            <div className="mt-2 flex flex-col gap-2 text-sm text-gray-700">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="reminder"
                  checked={reminderSlot === 'morning'}
                  onChange={() => setReminderSlot('morning')}
                />
                Morning
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="reminder"
                  checked={reminderSlot === 'midday'}
                  onChange={() => setReminderSlot('midday')}
                />
                Midday
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="reminder"
                  checked={reminderSlot === 'evening'}
                  onChange={() => setReminderSlot('evening')}
                />
                Evening
              </label>
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            {loading ? 'Creating…' : 'Create account & open check-in'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          <Link href={`/study/${encodeURIComponent(cohortSlug)}`} className="hover:underline" style={{ color: '#6A3F2B' }}>
            ← Back to study
          </Link>
        </div>
      </div>
    </div>
  )
}
