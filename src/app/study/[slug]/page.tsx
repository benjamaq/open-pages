import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { countCohortConfirmedParticipants, isCohortCapacityFull } from '@/lib/cohortRecruitment'
import { StudyApplyCta } from './StudyApplyCta'
import { CohortQualificationSection } from './CohortQualificationSection'

const RUST = '#C84B2F'
/** Hero + trust footer panel; override image via CSS `--cohort-hero-bg: url(...)` on `:root` or a parent. */
const DARK_PANEL_BG = '#1a1f2e'

function SpotCounterCard({
  confirmed,
  maxParticipants,
  displayCapacity,
  capacityFull,
}: {
  confirmed: number
  /** Real recruitment cap (enforcement); used as display denominator when displayCapacity unset. */
  maxParticipants: number | null
  /** Optional smaller hero cap for urgency; progress bar = confirmed / this (fallback: maxParticipants). */
  displayCapacity: number | null
  capacityFull: boolean
}) {
  const displayTotal =
    displayCapacity != null && Number.isFinite(Number(displayCapacity)) && Number(displayCapacity) > 0
      ? Math.floor(Number(displayCapacity))
      : maxParticipants != null && Number.isFinite(Number(maxParticipants)) && Number(maxParticipants) > 0
        ? Math.floor(Number(maxParticipants))
        : null

  const remaining = displayTotal != null ? Math.max(0, displayTotal - confirmed) : null
  const pct =
    displayTotal != null && displayTotal > 0
      ? Math.min(100, (confirmed / displayTotal) * 100)
      : capacityFull
        ? 100
        : 0

  return (
    <div
      className="mx-auto w-full max-w-md rounded-xl border border-white/20 px-5 py-5 sm:px-6 sm:py-6"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      {remaining != null ? (
        <p className="text-center text-[26px] font-bold leading-tight tracking-tight text-white sm:text-[34px]">
          Only{' '}
          <span className="tabular-nums" style={{ color: RUST }}>
            {remaining}
          </span>{' '}
          spot{remaining === 1 ? '' : 's'} remaining
        </p>
      ) : (
        <p className="text-center text-[22px] font-bold text-white sm:text-[28px]">Limited spots available</p>
      )}
      {displayTotal != null ? (
        <p className="mt-2 text-center text-[13px] text-white/70">
          <span className="font-semibold tabular-nums text-white/85">{confirmed}</span> of{' '}
          <span className="font-semibold tabular-nums text-white/85">{displayTotal}</span> early spots filled
        </p>
      ) : null}
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: RUST }}
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={displayTotal != null ? `Study spots ${Math.round(pct)} percent filled` : 'Study capacity'}
          role="progressbar"
        />
      </div>
    </div>
  )
}

function HowItWorksSteps({ studyDays }: { studyDays: number }) {
  const steps = [
    {
      n: '01',
      title: 'Apply today',
      body: `Selected participants complete a short application. We confirm your spot within 24 hours.`,
    },
    {
      n: '02',
      title: 'Track daily',
      body: `30 seconds each morning for ${studyDays} days. No wearable required.`,
    },
    {
      n: '03',
      title: 'Get your result',
      body: `Your personal before and after — delivered privately at the end of the study.`,
    },
  ]
  return (
    <section className="bg-[#faf9f7] py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-[22px] font-semibold text-neutral-900">How the study works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-xl border bg-white px-6 py-8"
              style={{ borderColor: '#e5e2dc' }}
            >
              <div className="text-left text-[48px] font-bold leading-none tabular-nums" style={{ color: RUST }}>
                {s.n}
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-neutral-900">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StoreCreditIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke={RUST} strokeWidth="1.5" />
      <path
        d="M8 10h8M8 14h5"
        stroke={RUST}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14.5 12.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5 1.5.7 1.5 1.5z"
        stroke={RUST}
        strokeWidth="1.5"
      />
    </svg>
  )
}

function BioStackrStudyIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 18V6l8-3 8 3v12l-8 3-8-3z"
        stroke={RUST}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 9v11M8 7v6M16 7v6" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function WhatYouReceive({ productName }: { productName: string }) {
  const headingProduct = `${productName} for the full 21 days`
  const cards = [
    {
      key: 'product',
      tag: 'Value: included',
      title: headingProduct,
      sub: 'Supplied by DoNotAge. Shipped before tracking begins.',
      body: 'Your product arrives before the study starts so you can begin your baseline check-ins right away.',
      visual: (
        <div
          className="mt-6 flex max-h-[120px] min-h-[88px] items-center justify-center overflow-hidden rounded-md border border-dashed bg-neutral-50"
          style={{ borderColor: '#e5e2dc' }}
        >
          <span className="text-[11px] text-neutral-400">Product image</span>
        </div>
      ),
    },
    {
      key: 'credit',
      tag: 'On completion',
      title: '£45–50 DoNotAge store credit',
      sub: 'Awarded when you complete all 21 daily check-ins.',
      body: `Use it on any DoNotAge product. A thank-you for helping us prove what ${productName} can do.`,
      visual: (
        <div
          className="mt-6 flex min-h-[88px] items-center justify-center rounded-md border bg-neutral-50/80"
          style={{ borderColor: '#e5e2dc' }}
          aria-hidden
        >
          <StoreCreditIcon />
        </div>
      ),
    },
    {
      key: 'pro',
      tag: 'Value: included',
      title: '3 months of BioStackr Pro',
      sub: 'The supplement tracking platform running this study.',
      body: 'Track your own supplement stack, see your personal results from this study, and keep tracking after it ends.',
      visual: (
        <div
          className="mt-6 flex min-h-[88px] items-center justify-center rounded-md border bg-neutral-50/80"
          style={{ borderColor: '#e5e2dc' }}
          aria-hidden
        >
          <BioStackrStudyIcon />
        </div>
      ),
    },
  ]

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-[22px] font-semibold text-neutral-900">What participants receive</h2>
        <p
          className="mx-auto mt-4 max-w-xl text-center text-[13px] font-medium leading-snug sm:text-[14px]"
          style={{ color: RUST }}
        >
          Every confirmed participant receives all three.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <div
              key={c.key}
              className="flex h-full flex-col rounded-xl border bg-white px-6 py-8"
              style={{ borderColor: '#e5e2dc' }}
            >
              <div className="text-left text-[40px] font-bold leading-none tabular-nums sm:text-[48px]" style={{ color: RUST }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-4 text-[15px] font-semibold leading-snug text-neutral-900">{c.title}</h3>
              <p className="mt-2 text-[13px] font-medium leading-relaxed text-neutral-700">{c.sub}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{c.body}</p>
              {c.visual}
              <p
                className="mt-4 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: RUST }}
              >
                {c.tag}
              </p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-[14px] font-medium leading-relaxed text-neutral-800">
          Combined value: over £90 — plus your personal study results, delivered privately at the end of the study.
        </p>
      </div>
    </section>
  )
}

function TrustFooter() {
  const col = (icon: ReactNode, label: string, body: string) => (
    <div className="flex flex-col items-center text-center sm:px-4">
      <div className="mb-3" style={{ color: RUST }}>
        {icon}
      </div>
      <p className="text-[14px] font-semibold text-white">{label}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-white/70">{body}</p>
    </div>
  )
  return (
    <footer className="py-14 sm:py-16" style={{ background: DARK_PANEL_BG }}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          {col(
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>,
            'Your data is private',
            'Participant results are anonymised. DoNotAge never sees individual level data.'
          )}
          {col(
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M7 16l4-4 4 4 6-6" />
            </svg>,
            'Statistical analysis',
            "Cohen's d effect sizes and confidence intervals — the same method used in academic research."
          )}
          {col(
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>,
            'No obligation',
            'Completing the application does not commit you to participating.'
          )}
        </div>
        <p className="mt-14 text-center text-[11px] text-white/40">
          This study is run by BioStackr on behalf of DoNotAge · biostackr.io · GDPR compliant
        </p>
      </div>
    </footer>
  )
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string }>
}

export const dynamic = 'force-dynamic'

export default async function StudyLandingPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params
  const { status: statusParam } = await searchParams
  const slug = String(rawSlug || '')
    .trim()
    .toLowerCase()
  if (!slug) notFound()

  const { data: cohort, error } = await supabaseAdmin
    .from('cohorts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[study] cohorts query failed', { slug, message: error.message, code: (error as { code?: string }).code })
    notFound()
  }
  if (!cohort) {
    console.warn('[study] no cohort row for slug', slug)
    notFound()
  }

  const cohortId = String((cohort as { id: string }).id)
  const maxP = (cohort as { max_participants?: number | null }).max_participants ?? null
  const displayCap = (cohort as { display_capacity?: number | null }).display_capacity ?? null

  const confirmedCount = await countCohortConfirmedParticipants(cohortId)
  const capacityFull = isCohortCapacityFull(maxP, confirmedCount)
  const showFullMessage = capacityFull || String(statusParam || '').toLowerCase() === 'full'

  const studyDays = typeof cohort.study_days === 'number' ? cohort.study_days : 21
  const productName = String(cohort.product_name || 'Study product')
  const brandName = String(cohort.brand_name || '')

  return (
    <div className="flex flex-1 flex-col text-neutral-900">
      <div className="flex flex-1 flex-col">
      {/* Section 1 — Hero — set --cohort-hero-bg when artwork image is ready */}
      <section
        className="w-full px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-8"
        style={{
          backgroundColor: DARK_PANEL_BG,
          backgroundImage: 'var(--cohort-hero-bg, none)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            {/* DoNotAge logo — replace with Image once assets arrive */}
            <div
              style={{
                width: 120,
                height: 40,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Brand logo</span>
            </div>
            <Link
              href="/"
              className="text-sm font-medium tracking-wide text-white/60 transition-colors hover:text-white/90 sm:mt-1 sm:text-right"
            >
              BioStackr
            </Link>
          </div>

          <div className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: RUST }}
            >
              Private study invitation
            </p>
            <h1 className="mt-4 text-[32px] font-bold leading-tight text-white sm:text-[42px]">
              {productName}
            </h1>
            <p className="mt-2 text-[18px] text-white/60">Customer Outcomes Study</p>
            <div className="mx-auto mt-8 flex justify-center">
              <div className="h-px w-[60px]" style={{ background: RUST }} />
            </div>

            {!showFullMessage ? (
              <div className="mt-10">
                <SpotCounterCard
                  confirmed={confirmedCount}
                  maxParticipants={maxP}
                  displayCapacity={displayCap}
                  capacityFull={capacityFull}
                />
              </div>
            ) : (
              <div
                className="mx-auto mt-10 max-w-md rounded-xl border border-white/20 px-5 py-4 text-center text-sm text-white/80"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                role="status"
              >
                This study is now full.
              </div>
            )}

            <p className="mx-auto mt-10 max-w-[600px] text-center text-[18px] leading-relaxed text-white">
              {brandName ? `${brandName} is working with BioStackr` : 'BioStackr'} to measure what {productName}{' '}
              actually does in real customers. You have been selected as a potential participant.
            </p>

            {!showFullMessage ? (
              <div className="mt-10 flex justify-center">
                <StudyApplyCta variant="hero" />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {!showFullMessage ? (
        <>
          <HowItWorksSteps studyDays={studyDays} />
          <WhatYouReceive productName={productName} />
          <section className="bg-[#faf9f7] py-14 sm:py-20">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
              <CohortQualificationSection
                cohortSlug={cohort.slug}
                cohortBrandName={brandName}
                productName={productName}
              />
            </div>
          </section>
        </>
      ) : null}
      </div>

      <TrustFooter />
    </div>
  )
}
