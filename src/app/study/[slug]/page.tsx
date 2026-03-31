import type { ReactNode } from 'react'
import Image from 'next/image'
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
        <p className="text-center text-[18px] font-bold leading-snug text-white sm:text-[22px]">
          <span className="tabular-nums text-white/95">{confirmed}</span>
          <span className="text-white/80"> of </span>
          <span className="tabular-nums text-white/95">{displayTotal}</span>
          <span className="text-white/80"> spots filled</span>
          <span className="mx-1.5 text-white/45 sm:mx-2" aria-hidden>
            ·
          </span>
          <span className="tabular-nums" style={{ color: RUST }}>
            {remaining}
          </span>
          <span style={{ color: RUST }}> remaining</span>
        </p>
      ) : (
        <p className="text-center text-[22px] font-bold text-white sm:text-[28px]">Limited spots available</p>
      )}
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

function IconHowApply() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={RUST}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 21a8 8 0 0116 0" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconHowCheckin() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke={RUST} strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4M4 11h16" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 15l2 2 4-4" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconHowResults() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 19h16" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 15l3-4 3 2 4-6" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HowItWorksSteps() {
  const steps = [
    {
      icon: <IconHowApply />,
      title: 'Apply for your spot',
      line: 'A short application. Confirmed within 24 hours.',
    },
    {
      icon: <IconHowCheckin />,
      title: 'Check in each morning',
      line: '30 seconds. Four questions. No wearable needed.',
    },
    {
      icon: <IconHowResults />,
      title: 'Get your personal results',
      line: 'Your before and after, delivered privately.',
    },
  ]
  return (
    <section className="bg-[#faf9f7] py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-[22px] font-semibold text-neutral-900">How the study works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border bg-white px-6 py-7"
              style={{ borderColor: '#e5e2dc' }}
            >
              <div className="mb-1">{s.icon}</div>
              <h3 className="text-[15px] font-bold leading-snug text-neutral-900">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-snug text-neutral-600">{s.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Bottle silhouette only — swap for product photo when available. */
function ProductBottleVisual() {
  return (
    <div className="flex h-full w-full min-h-0 flex-1 items-center justify-center bg-white px-4">
      <svg
        width="56"
        height="72"
        viewBox="0 0 56 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-neutral-400"
        aria-hidden
      >
        <path
          d="M28 4c-6 0-11 4-11 10v8c0 2 1 4 3 5v35a8 8 0 0016 0V27c2-1 3-3 3-5v-8c0-6-5-10-11-10z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M20 22h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  )
}

function DonotageLogoMark() {
  return (
    <div
      className="flex h-11 min-w-[120px] max-w-[180px] items-center justify-center rounded-md border bg-white px-4 shadow-sm"
      style={{ borderColor: '#e5e2dc' }}
      aria-label="DoNotAge"
    >
      <span className="text-[13px] font-semibold tracking-tight text-neutral-800">DoNotAge</span>
    </div>
  )
}

type IncentiveShelfCardProps = {
  visual: ReactNode
  bold: string
  muted: string
  tag: string
}

function IncentiveShelfCard({ visual, bold, muted, tag }: IncentiveShelfCardProps) {
  return (
    <div
      className="flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl border bg-white md:min-h-[420px]"
      style={{ borderColor: '#e5e2dc' }}
    >
      <div className="flex min-h-0 flex-[3] flex-col bg-neutral-50/30">{visual}</div>
      <div className="flex flex-[2] flex-col justify-between px-5 pb-4 pt-4">
        <div>
          <h3 className="truncate text-[15px] font-bold leading-snug text-neutral-900" title={bold}>
            {bold}
          </h3>
          <p className="mt-1.5 text-[13px] leading-snug text-neutral-500">{muted}</p>
        </div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide" style={{ color: RUST }}>
          {tag}
        </p>
      </div>
    </div>
  )
}

function WhatYouReceive({ productName }: { productName: string }) {
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
        <div className="mt-10 grid gap-6 md:grid-cols-3 md:items-stretch">
          <IncentiveShelfCard
            visual={<ProductBottleVisual />}
            bold={`${productName} for 21 days`}
            muted="Shipped to you before the study begins."
            tag="VALUE: INCLUDED"
          />
          <IncentiveShelfCard
            visual={
              <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-6">
                <DonotageLogoMark />
                <p className="text-[26px] font-bold leading-none sm:text-[28px]" style={{ color: RUST }}>
                  £45–50
                </p>
              </div>
            }
            bold="DoNotAge store credit"
            muted="Yours when you complete all 21 check-ins."
            tag="ON COMPLETION"
          />
          <IncentiveShelfCard
            visual={
              <div className="flex h-full min-h-0 flex-1 items-center justify-center px-4 py-6">
                <Image
                  src="/brand/biostackr-logo.png"
                  alt="BioStackr"
                  width={180}
                  height={44}
                  className="h-11 w-auto max-w-[min(90%,180px)] object-contain object-center"
                />
              </div>
            }
            bold="3 months BioStackr Pro"
            muted="Track your stack. See your personal study results."
            tag="VALUE: INCLUDED"
          />
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-[13px] leading-relaxed text-neutral-500">
          Combined value: over £90 — plus your personal results, delivered privately.
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
          <HowItWorksSteps />
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
