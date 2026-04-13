'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DailyCheckinModal from '@/components/DailyCheckinModal'
import { COHORT_DASHBOARD_VIEW_QUERY, COHORT_DASHBOARD_VIEW_VALUE } from '@/lib/cohortDashboardDeepLink'
import { dedupedJson } from '@/lib/utils/dedupedJson'
import { appendLocalTodayParam } from '@/lib/utils/localDateYmd'

const PENDING_CHECKIN_KEY = 'bs_pending_checkin_intent'

function trimCohortId(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  return s !== '' ? s : null
}

function cohortProductArrivedYmdFromMe(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const y = raw.trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(y) ? y : null
}

export function CheckinLauncher({
  mePayload,
  supplementsPayload,
  progressPayload,
}: {
  mePayload?: any
  supplementsPayload?: any
  progressPayload?: any
}) {
  const router = useRouter()
  const search = useSearchParams()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [todayItems, setTodayItems] = useState<any>({
    supplements: [],
    protocols: [],
    movement: [],
    mindfulness: [],
    food: [],
    gear: [],
  })
  const [currentEnergy, setCurrentEnergy] = useState<number>(5)
  /** Set only when mePayload is undefined (standalone fetch). */
  const [asyncCohortHint, setAsyncCohortHint] = useState<string | null | undefined>(undefined)
  const [asyncCheckinFields, setAsyncCheckinFields] = useState<string[] | null | undefined>(undefined)
  const [asyncStudyProductName, setAsyncStudyProductName] = useState<string | null | undefined>(undefined)
  /** Mirrors /api/me `showCohortStudyDashboard` when mePayload is not passed in. */
  const [asyncShowCohortStudyDashboard, setAsyncShowCohortStudyDashboard] = useState<boolean | undefined>(undefined)
  /** Mirrors /api/me `cohortCheckinBranch` when mePayload is not passed in. */
  const [asyncCohortCheckinBranch, setAsyncCohortCheckinBranch] = useState<boolean | undefined>(undefined)
  /** Mirrors /api/me `cohortHasCheckedInToday` when mePayload is not passed in. */
  const [asyncCohortHasCheckedInToday, setAsyncCohortHasCheckedInToday] = useState<boolean | undefined>(undefined)
  /** Mirrors /api/me `cohortConfirmed` when mePayload is not passed in. */
  const [asyncCohortConfirmed, setAsyncCohortConfirmed] = useState<boolean | undefined>(undefined)
  /** Mirrors /api/me `cohortCheckinCount` when mePayload is not passed in. */
  const [asyncCohortCheckinCount, setAsyncCohortCheckinCount] = useState<number | undefined>(undefined)
  /** Mirrors /api/me `cohortStudyStartedAtIso` when mePayload is not passed in. */
  const [asyncCohortStudyStartedAtIso, setAsyncCohortStudyStartedAtIso] = useState<string | null | undefined>(
    undefined,
  )
  const [asyncCohortParticipantProductArrivedAtYmd, setAsyncCohortParticipantProductArrivedAtYmd] = useState<
    string | null | undefined
  >(undefined)
  const [asyncMeDone, setAsyncMeDone] = useState(false)

  useEffect(() => {
    const val = search.get('checkin')
    if (val === 'open' || val === '1') {
      try {
        sessionStorage.setItem(PENDING_CHECKIN_KEY, '1')
      } catch {}
      try {
        const cohortView =
          search.get(COHORT_DASHBOARD_VIEW_QUERY) === COHORT_DASHBOARD_VIEW_VALUE
        router.replace(
          cohortView
            ? `/dashboard?${COHORT_DASHBOARD_VIEW_QUERY}=${COHORT_DASHBOARD_VIEW_VALUE}`
            : '/dashboard',
        )
      } catch {}
    }
  }, [search, router])

  useEffect(() => {
    const handler = () => setOpen(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('open:checkin:new' as any, handler as any)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open:checkin:new' as any, handler as any)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (mePayload !== undefined) {
      try {
        const data = mePayload || {}
        if (data?.userId) setUserId(String(data.userId))
        else if (data?.id) setUserId(String(data.id))
        if (data?.firstName) setUserName(String(data.firstName))
      } catch {}
      setAsyncCohortHint(undefined)
      setAsyncCheckinFields(undefined)
      setAsyncStudyProductName(undefined)
      setAsyncShowCohortStudyDashboard(undefined)
      setAsyncCohortCheckinBranch(undefined)
      setAsyncCohortHasCheckedInToday(undefined)
      setAsyncCohortConfirmed(undefined)
      setAsyncCohortCheckinCount(undefined)
      setAsyncCohortStudyStartedAtIso(undefined)
      setAsyncCohortParticipantProductArrivedAtYmd(undefined)
      setAsyncMeDone(false)
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
      try {
        const res = await dedupedJson<any>('/api/me', { cache: 'no-store', credentials: 'include' })
        if (!res.ok) {
          if (!cancelled) setAsyncMeDone(true)
          return
        }
        const data = res.data || {}
        if (cancelled) return
        if (data?.userId) setUserId(String(data.userId))
        if (data?.firstName) setUserName(String(data.firstName))
        setAsyncCohortHint(trimCohortId(data?.cohortId))
        if ('checkinFields' in data) {
          const cf = (data as { checkinFields?: string[] | null }).checkinFields
          setAsyncCheckinFields(Array.isArray(cf) ? cf : cf === null ? null : null)
        } else {
          setAsyncCheckinFields(null)
        }
        const pn = (data as any)?.cohortStudyProductName
        setAsyncStudyProductName(typeof pn === 'string' && pn.trim() ? pn.trim() : null)
        const sc = (data as any)?.showCohortStudyDashboard
        setAsyncShowCohortStudyDashboard(typeof sc === 'boolean' ? sc : undefined)
        const ccb = (data as any)?.cohortCheckinBranch
        setAsyncCohortCheckinBranch(typeof ccb === 'boolean' ? ccb : undefined)
        const ht = (data as any)?.cohortHasCheckedInToday
        setAsyncCohortHasCheckedInToday(typeof ht === 'boolean' ? ht : undefined)
        const cohortConfirmedRaw = (data as any)?.cohortConfirmed
        setAsyncCohortConfirmed(typeof cohortConfirmedRaw === 'boolean' ? cohortConfirmedRaw : undefined)
        const cc = (data as any)?.cohortCheckinCount
        setAsyncCohortCheckinCount(typeof cc === 'number' && Number.isFinite(cc) ? cc : undefined)
        const css = (data as any)?.cohortStudyStartedAtIso
        setAsyncCohortStudyStartedAtIso(
          typeof css === 'string' && String(css).trim() !== '' ? String(css).trim() : null,
        )
        const pa = (data as any)?.cohortParticipantProductArrivedAt
        setAsyncCohortParticipantProductArrivedAtYmd(cohortProductArrivedYmdFromMe(pa))
      } catch {
        if (!cancelled) {
          setAsyncCohortHint(null)
          setAsyncCheckinFields(null)
          setAsyncStudyProductName(null)
          setAsyncShowCohortStudyDashboard(undefined)
          setAsyncCohortCheckinBranch(undefined)
          setAsyncCohortHasCheckedInToday(undefined)
          setAsyncCohortConfirmed(undefined)
          setAsyncCohortCheckinCount(undefined)
          setAsyncCohortStudyStartedAtIso(undefined)
          setAsyncCohortParticipantProductArrivedAtYmd(undefined)
        }
      } finally {
        if (!cancelled) setAsyncMeDone(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mePayload])

  // Resolve ?checkin=1: welcome screen first (cohort, zero check-ins since enroll), else open modal.
  // If cohort study user already completed today's check-in, do not force the modal — show dashboard state.
  useEffect(() => {
    let pending = false
    try {
      pending = sessionStorage.getItem(PENDING_CHECKIN_KEY) === '1'
    } catch {
      pending = false
    }
    if (!pending) return

    const fromDashboardMe = mePayload !== undefined
    const ready = fromDashboardMe || asyncMeDone
    if (!ready) return

    const showCohortDash = fromDashboardMe
      ? Boolean((mePayload as any)?.showCohortStudyDashboard)
      : Boolean(asyncShowCohortStudyDashboard)
    const doneCohortToday = fromDashboardMe
      ? Boolean((mePayload as any)?.cohortHasCheckedInToday)
      : Boolean(asyncCohortHasCheckedInToday)

    try {
      sessionStorage.removeItem(PENDING_CHECKIN_KEY)
    } catch {}

    if (showCohortDash && doneCohortToday) {
      return
    }

    // Landed via ?checkin=1 (email magic links promise check-in). Open the drawer directly —
    // do not require a second click through "Secure your place" interstitial.
    setOpen(true)
  }, [mePayload, asyncMeDone, asyncShowCohortStudyDashboard, asyncCohortHasCheckedInToday])

  useEffect(() => {
    let cancelled = false
    if (supplementsPayload !== undefined) {
      try {
        const rows = Array.isArray(supplementsPayload) ? supplementsPayload : []
        const supplements = rows
          .filter((row: any) => row?.is_active !== false)
          .map((row: any) => ({
            id: String(row?.intake_id ?? row?.user_supplement_id ?? row?.id ?? row?.supplement_id ?? ''),
            name: String(row?.name ?? row?.label ?? row?.canonical_name ?? 'Supplement'),
          }))
          .filter((s: any) => s.id)
        setTodayItems((ti: any) => ({ ...ti, supplements }))
      } catch {}
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
      try {
        const r = await dedupedJson<any>('/api/supplements', { cache: 'no-store' })
        const j = r.ok ? r.data : []
        if (cancelled) return
        const rows = Array.isArray(j) ? j : []
        const supplements = rows
          .filter((row: any) => row?.is_active !== false)
          .map((row: any) => ({
            id: String(row?.intake_id ?? row?.user_supplement_id ?? row?.id ?? row?.supplement_id ?? ''),
            name: String(row?.name ?? row?.label ?? row?.canonical_name ?? 'Supplement'),
          }))
          .filter((s: any) => s.id)
        setTodayItems((ti: any) => ({ ...ti, supplements }))
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [supplementsPayload])

  useEffect(() => {
    let cancelled = false
    if (progressPayload !== undefined) {
      try {
        const j = progressPayload || {}
        const skip = Array.isArray(j?.rotation?.action?.skip) ? j.rotation.action.skip : []
        const names = Array.from(
          new Map(
            skip
              .map((s: any) => String(s?.name || '').trim())
              .filter(Boolean)
              .map((n: string) => [n.toLowerCase(), n])
          ).values()
        )
        if (names.length > 0) {
          setTodayItems((ti: any) => ({ ...ti, skipNames: names }))
          try {
            const todayStr = new Date().toISOString().split('T')[0]
            localStorage.setItem('biostackr_skip_names_today', JSON.stringify({ date: todayStr, names }))
          } catch {}
        }
      } catch {}
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
      try {
        const r = await dedupedJson<any>(appendLocalTodayParam('/api/progress/loop'), { cache: 'no-store' })
        if (!r.ok) return
        const j = r.data || {}
        if (cancelled) return
        const skip = Array.isArray(j?.rotation?.action?.skip) ? j.rotation.action.skip : []
        const names = Array.from(
          new Map(
            skip
              .map((s: any) => String(s?.name || '').trim())
              .filter(Boolean)
              .map((n: string) => [n.toLowerCase(), n])
          ).values()
        )
        if (names.length > 0) {
          setTodayItems((ti: any) => ({ ...ti, skipNames: names }))
          try {
            const todayStr = new Date().toISOString().split('T')[0]
            localStorage.setItem('biostackr_skip_names_today', JSON.stringify({ date: todayStr, names }))
          } catch {}
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [progressPayload])

  const today = new Date().toISOString().split('T')[0]

  const cohortIdHint = mePayload !== undefined ? trimCohortId(mePayload?.cohortId) : asyncCohortHint

  const cohortCheckinFieldsHint =
    mePayload !== undefined
      ? (('checkinFields' in (mePayload || {})
          ? (mePayload as { checkinFields?: string[] | null }).checkinFields
          : null) as string[] | null | undefined)
      : asyncCheckinFields

  const cohortStudyProductName =
    mePayload !== undefined
      ? (typeof (mePayload as any)?.cohortStudyProductName === 'string'
          ? String((mePayload as any).cohortStudyProductName).trim()
          : null)
      : asyncStudyProductName ?? null

  const showCohortStudyDashboardRaw =
    mePayload !== undefined
      ? (mePayload as { showCohortStudyDashboard?: unknown })?.showCohortStudyDashboard
      : asyncShowCohortStudyDashboard
  const showCohortStudyDashboardProp =
    typeof showCohortStudyDashboardRaw === 'boolean' ? showCohortStudyDashboardRaw : undefined

  const cohortCheckinBranchRaw =
    mePayload !== undefined
      ? (mePayload as { cohortCheckinBranch?: unknown })?.cohortCheckinBranch
      : asyncCohortCheckinBranch
  const cohortCheckinBranchProp =
    typeof cohortCheckinBranchRaw === 'boolean' ? cohortCheckinBranchRaw : undefined

  const cohortSpotConfirmed =
    mePayload !== undefined
      ? typeof (mePayload as { cohortConfirmed?: unknown }).cohortConfirmed === 'boolean'
        ? Boolean((mePayload as { cohortConfirmed?: boolean }).cohortConfirmed)
        : undefined
      : asyncCohortConfirmed !== undefined
        ? Boolean(asyncCohortConfirmed)
        : undefined

  const cohortComplianceDistinctDays: number | null =
    mePayload !== undefined
      ? typeof (mePayload as { cohortCheckinCount?: unknown }).cohortCheckinCount === 'number'
        ? (mePayload as { cohortCheckinCount: number }).cohortCheckinCount
        : null
      : typeof asyncCohortCheckinCount === 'number'
        ? asyncCohortCheckinCount
        : null

  const cohortStudyStartedAtIso: string | null | undefined =
    mePayload !== undefined
      ? typeof (mePayload as { cohortStudyStartedAtIso?: unknown }).cohortStudyStartedAtIso === 'string' &&
          String((mePayload as { cohortStudyStartedAtIso: string }).cohortStudyStartedAtIso).trim() !== ''
        ? String((mePayload as { cohortStudyStartedAtIso: string }).cohortStudyStartedAtIso).trim()
        : null
      : asyncCohortStudyStartedAtIso

  const cohortParticipantProductArrivedAtYmd: string | null | undefined =
    mePayload !== undefined
      ? cohortProductArrivedYmdFromMe(
          (mePayload as { cohortParticipantProductArrivedAt?: unknown }).cohortParticipantProductArrivedAt,
        )
      : asyncCohortParticipantProductArrivedAtYmd

  useEffect(() => {
    try {
      console.log('[CheckinLauncher] cohortIdHint=', cohortIdHint, 'userId=', userId, 'modalOpen=', open)
    } catch {}
  }, [cohortIdHint, userId, open])

  const closeModal = () => {
    setOpen(false)
    try {
      router.replace('/dashboard')
    } catch {}
  }

  return (
    <>
      {open && (
        <DailyCheckinModal
          isOpen={true}
          onClose={closeModal}
          onEnergyUpdate={(n: number) => setCurrentEnergy(n)}
          currentEnergy={currentEnergy}
          todayItems={todayItems}
          userId={userId || 'guest'}
          cohortIdHint={cohortIdHint}
          cohortCheckinFieldsHint={cohortCheckinFieldsHint}
          cohortStudyProductName={cohortStudyProductName}
          showCohortStudyDashboard={showCohortStudyDashboardProp}
          cohortCheckinBranch={cohortCheckinBranchProp}
          cohortSpotConfirmed={cohortSpotConfirmed}
          cohortComplianceDistinctDays={cohortComplianceDistinctDays}
          cohortStudyStartedAtIso={cohortStudyStartedAtIso}
          cohortParticipantProductArrivedAtYmd={cohortParticipantProductArrivedAtYmd}
        />
      )}
    </>
  )
}
