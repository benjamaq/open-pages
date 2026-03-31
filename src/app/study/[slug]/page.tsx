import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { countCohortConfirmedParticipants, isCohortCapacityFull } from '@/lib/cohortRecruitment'
import { StudyApplyCta } from './StudyApplyCta'
import { CohortQualificationSection } from './CohortQualificationSection'

const RUST = '#C84B2F'
/** Hero + trust footer panel; override image via CSS `--cohort-hero-bg: url(...)` on `:root` or a parent. */
const DARK_PANEL_BG = '#1a1f2e'

const DNA_LOGO_WHITE = '/DNA-logo-white.png'
const DNA_LOGO_BLACK = '/DNA-logo-black.png'
const SURE_SLEEP_PRODUCT = '/suresleep-240x240.png'
/** Same asset as dashboard/marketing headers (`src/app/biostackr/page.tsx`). */
const BIOSTACKR_LOGO = '/BIOSTACKR LOGO 2.png'

/** Subtle noise overlay when no `--cohort-hero-bg` photograph is set. */
const HERO_GRAIN_BG = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.05'/></svg>")`

function HeroCohortStatusCard({
  confirmed,
  maxParticipants,
  displayCapacity,
  capacityFull,
}: {
  confirmed: number
  /** Real recruitment cap (enforcement); used as display denominator when displayCapacity unset. */
  maxParticipants: number | null
  /** Optional smaller hero cap for display; progress bar = confirmed / this (fallback: maxParticipants). */
  displayCapacity: number | null
  capacityFull: boolean
}) {
  const displayTotal =
    displayCapacity != null && Number.isFinite(Number(displayCapacity)) && Number(displayCapacity) > 0
      ? Math.floor(Number(displayCapacity))
      : maxParticipants != null && Number.isFinite(Number(maxParticipants)) && Number(maxParticipants) > 0
        ? Math.floor(Number(maxParticipants))
        : null

  const pct =
    displayTotal != null && displayTotal > 0
      ? Math.min(100, (confirmed / displayTotal) * 100)
      : capacityFull
        ? 100
        : 0

  return (
    <div
      className="mx-auto w-full max-w-md rounded-xl border border-white/20 px-5 py-5 sm:px-6 sm:py-6"
      style={{
        background: 'rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <p className="text-center text-[17px] font-bold leading-snug text-white sm:text-[19px]">
        {displayTotal != null ? (
          <>
            Limited cohort: <span className="tabular-nums text-white/95">{displayTotal}</span> participants
          </>
        ) : (
          'Limited cohort'
        )}
      </p>
      <p className="mt-2 text-center text-[14px] font-medium leading-relaxed text-white/75">
        Applications reviewed within 24 hours
      </p>
      {displayTotal != null ? (
        <p className="mt-2 text-center text-[12px] tabular-nums tracking-tight text-white/50">
          {confirmed} of {displayTotal} places confirmed
        </p>
      ) : null}
      {displayTotal != null ? (
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: RUST,
              boxShadow: '0 0 16px rgba(200, 75, 47, 0.55), 0 0 4px rgba(200, 75, 47, 0.45)',
            }}
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={
              displayTotal != null ? `Places confirmed ${Math.round(pct)} percent` : 'Study capacity'
            }
            role="progressbar"
          />
        </div>
      ) : null}
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

function SectionDonotageLogoBlack({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Image
        src={DNA_LOGO_BLACK}
        alt="DoNotAge.org"
        width={200}
        height={200}
        className="h-11 w-auto object-contain opacity-95 sm:h-12"
      />
    </div>
  )
}

/** Partner marks for light-background bands (clinical study landing). */
function StudyLightSectionBrandRow({ className = '' }: { className?: string }) {
  return (
    <div
      className={`mb-8 flex flex-col items-center gap-6 sm:mb-10 sm:flex-row sm:justify-center sm:gap-12 ${className}`}
    >
      <SectionDonotageLogoBlack className="!mb-0" />
      <div className="hidden h-8 w-px shrink-0 bg-neutral-200 sm:block" aria-hidden />
      <SectionBioStackrLogoLight className="!mb-0" />
    </div>
  )
}

function HowItWorksSteps() {
  const steps = [
    {
      icon: <IconHowApply />,
      title: 'Apply for a place in the study',
      line: 'A short application to assess fit. Selected participants are confirmed within 24 hours.',
    },
    {
      icon: <IconHowCheckin />,
      title: 'Track your results daily',
      line: 'A 30-second morning check-in capturing measurable changes across key outcomes. No wearable required.',
    },
    {
      icon: <IconHowResults />,
      title: 'See what actually changed for you',
      line: 'A personal outcome report showing how your sleep responded over 21 days, built from your own tracked data.',
    },
  ]
  return (
    <section className="bg-[#faf9f7] py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <StudyLightSectionBrandRow />
        <h2 className="text-center text-[22px] font-bold text-neutral-900">How the study works</h2>
        <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
          A structured 21-day study designed to measure real changes in real people.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3 md:items-stretch">
          {steps.map((s) => (
            <div
              key={s.title}
              className="flex h-full min-h-0 flex-col rounded-xl border bg-white px-7 py-9"
              style={{ borderColor: '#e5e2dc' }}
            >
              <div className="mb-3 shrink-0">{s.icon}</div>
              <h3 className="text-[15px] font-extrabold leading-snug text-neutral-900">{s.title}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">{s.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Bottle silhouette — study supply card before live product photography. */
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

function HeroDonotageLogo() {
  return (
    <Image
      src={DNA_LOGO_WHITE}
      alt="DoNotAge.org"
      width={200}
      height={200}
      className="h-[68px] w-auto object-contain object-left sm:h-[76px]"
      priority
    />
  )
}

function HeroBioStackrLogo() {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center self-start sm:self-auto sm:mt-0.5"
    >
      <Image
        src={BIOSTACKR_LOGO}
        alt="BioStackr"
        width={434}
        height={135}
        className="h-7 w-auto brightness-125 contrast-100 sm:h-8"
        priority
      />
      <span className="sr-only">BioStackr home</span>
    </Link>
  )
}

function SectionBioStackrLogoLight({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Link href="/" className="inline-flex opacity-90 transition-opacity hover:opacity-100">
        <Image
          src={BIOSTACKR_LOGO}
          alt="BioStackr"
          width={434}
          height={135}
          className="h-8 w-auto sm:h-9"
        />
        <span className="sr-only">BioStackr home</span>
      </Link>
    </div>
  )
}

function SureSleepPackVisual() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-gradient-to-b from-white to-neutral-50 px-4 py-8">
      <Image
        src={SURE_SLEEP_PRODUCT}
        alt="SureSleep — three-month supply from DoNotAge"
        width={240}
        height={240}
        className="h-auto max-h-[240px] w-auto max-w-[240px] object-contain drop-shadow-sm"
      />
    </div>
  )
}

type IncentiveShelfCardProps = {
  visual: ReactNode
  title: string
  body: string
  bodyExtra?: string
  tagline?: string
  footer: string
  /** Stronger border and shadow for the primary incentive card */
  highlight?: boolean
}

function IncentiveShelfCard({
  visual,
  title,
  body,
  bodyExtra,
  tagline,
  footer,
  highlight,
}: IncentiveShelfCardProps) {
  return (
    <div
      className={`flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border bg-white md:min-h-[448px] ${
        highlight ? 'ring-2 ring-[#C84B2F]/20 shadow-[0_10px_40px_rgba(200,75,47,0.12)]' : ''
      }`}
      style={{ borderColor: highlight ? RUST : '#e5e2dc' }}
    >
      <div className="flex min-h-0 flex-[3] flex-col bg-neutral-50/30">{visual}</div>
      <div className="flex flex-[2] flex-col justify-between px-6 pb-6 pt-5">
        <div>
          <h3 className="text-[16px] font-extrabold leading-snug text-neutral-900">{title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{body}</p>
          {bodyExtra ? (
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{bodyExtra}</p>
          ) : null}
          {tagline ? (
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">{tagline}</p>
          ) : null}
        </div>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: RUST }}>
          {footer}
        </p>
      </div>
    </div>
  )
}

function BioStackrDashboardMock() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-stretch justify-center bg-gradient-to-b from-[#f4f6fa] to-[#e8ecf4] px-4 py-5">
      <div
        className="flex w-full max-w-[220px] flex-col rounded-lg border border-neutral-200/90 bg-white p-3 shadow-sm"
        style={{ boxShadow: '0 4px 24px rgba(26,31,46,0.08)' }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Outcomes</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
        </div>
        <div className="relative h-[72px] w-full">
          <svg viewBox="0 0 200 72" className="h-full w-full" aria-hidden>
            <line x1="8" y1="56" x2="192" y2="56" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="8" y1="36" x2="192" y2="36" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="8" y1="16" x2="192" y2="16" stroke="#f3f4f6" strokeWidth="1" />
            <path
              d="M 12 48 L 48 42 L 82 38 L 118 28 L 152 22 L 188 14"
              fill="none"
              stroke={RUST}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold leading-tight text-emerald-900 ring-1 ring-emerald-200/80">
            Improved sleep onset
          </span>
        </div>
      </div>
    </div>
  )
}

function WhatYouReceive({ productName }: { productName: string }) {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <StudyLightSectionBrandRow className="!mb-6 sm:!mb-8" />
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          This is a structured study, not a survey.
        </p>
        <h2 className="mt-4 text-center text-[22px] font-bold text-neutral-900 sm:text-[24px]">
          What you receive as a participant
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
          Confirmed participants receive the full study package below.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3 md:items-stretch">
          <IncentiveShelfCard
            visual={<ProductBottleVisual />}
            title={`${productName} for the full 21 days`}
            body="Delivered before the study begins so you can track real changes from day one."
            footer="Included for all confirmed participants"
          />
          <IncentiveShelfCard
            highlight
            visual={<SureSleepPackVisual />}
            title="3 months of SureSleep from DoNotAge"
            body="A three-month supply of SureSleep (valued at £153) when you complete all 21 daily check-ins."
            tagline="Shipped by DoNotAge so you can keep the routine that worked for you in the study."
            footer="Completion reward"
          />
          <IncentiveShelfCard
            visual={<BioStackrDashboardMock />}
            title="3 months BioStackr Pro"
            body="Access your personal dashboard, track your outcomes, and see exactly how your stack performs over time."
            bodyExtra="Includes your personal study results and ongoing tracking."
            footer="Included for all participants"
          />
        </div>
        <div className="mx-auto mt-12 max-w-2xl space-y-2 text-center">
          <p className="text-[15px] font-semibold leading-relaxed text-neutral-800">
            Total package value: £153+ in DoNotAge product, BioStackr Pro, and your personal outcome report
          </p>
          <p className="text-[13px] leading-relaxed text-neutral-500">
            A clear view of how your sleep responded over 21 days, based on your own data.
          </p>
        </div>
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
        <div className="mb-10 flex flex-col items-center justify-center gap-8 sm:mb-12 sm:flex-row sm:gap-14">
          <Image
            src={DNA_LOGO_WHITE}
            alt="DoNotAge.org"
            width={160}
            height={160}
            className="h-9 w-auto object-contain opacity-90 sm:h-10"
          />
          <div className="hidden h-9 w-px shrink-0 bg-white/20 sm:block" aria-hidden />
          <Link href="/" className="inline-flex opacity-90 transition-opacity hover:opacity-100">
            <Image
              src={BIOSTACKR_LOGO}
              alt="BioStackr"
              width={434}
              height={135}
              className="h-7 w-auto brightness-125 sm:h-8"
            />
            <span className="sr-only">BioStackr home</span>
          </Link>
        </div>
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
            "Cohen's d effect sizes and confidence intervals, the same method used in academic research."
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
      {/* Hero: optional art via `--cohort-hero-bg`; default depth from orbs + grain. */}
      <section
        className="relative w-full overflow-hidden px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-8"
        style={{
          backgroundColor: DARK_PANEL_BG,
          backgroundImage: 'var(--cohort-hero-bg, none)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <div
            className="absolute -top-28 left-1/2 h-[min(420px,55vw)] w-[min(520px,90vw)] -translate-x-1/2 rounded-full opacity-[0.13] blur-3xl"
            style={{ background: RUST }}
          />
          <div
            className="absolute -bottom-40 -right-4 h-72 w-72 rounded-full opacity-[0.09] blur-3xl sm:h-96 sm:w-96"
            style={{ background: '#5e6e94' }}
          />
          <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: HERO_GRAIN_BG }} />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 90% 75% at 50% 20%, transparent 0%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.52) 100%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <HeroDonotageLogo />
            <HeroBioStackrLogo />
          </div>

          <div className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: RUST }}
            >
              Private study invitation
            </p>
            <h1 className="mt-4 text-[32px] font-bold leading-tight text-white sm:text-[42px]">
              {productName}
            </h1>
            <p className="mt-2 text-[17px] text-white/65 sm:text-[18px]">21-day customer outcomes study</p>
            <div className="mx-auto mt-8 flex justify-center">
              <div className="h-px w-[60px]" style={{ background: RUST }} />
            </div>

            {!showFullMessage ? (
              <div className="mt-10">
                <HeroCohortStatusCard
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

            <div className="mx-auto mt-10 max-w-[600px] space-y-4 text-center text-[17px] leading-relaxed text-white/95 sm:text-[18px]">
              <p>
                {brandName ? `${brandName} is working with BioStackr` : 'BioStackr'} to measure what {productName}{' '}
                actually does in real customers.
              </p>
              <p className="text-white/90">
                This is a structured 21-day study designed to capture measurable changes in sleep using daily tracking.
              </p>
              <p className="font-medium text-white">You have been invited to apply.</p>
            </div>

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
          <section className="bg-[#faf9f7] py-16 sm:py-24">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
              <StudyLightSectionBrandRow />
              <CohortQualificationSection
                cohortSlug={cohort.slug}
                cohortBrandName={brandName}
                productName={productName}
                cohortCapacityFull={capacityFull}
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
