import { Fragment, type ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  cognitiveOutcomeStripForStudyPage,
  isCognitiveShapedCheckinFields,
  isSleepShapedCheckinFields,
  normalizeCohortCheckinFields,
} from '@/lib/cohortCheckinFields'
import { resolveStudyLandingRewards } from '@/lib/cohortStudyLandingRewards'
import {
  COGNITIVE_COHORT_STUDY_ASSETS,
  GENERIC_STUDY_PLACEHOLDER_IMAGE,
  SLEEP_PACK_PRODUCT_IMAGE,
} from '@/lib/cohortStudyPageAssets'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { countCohortPipelineParticipants, isCohortEnrollmentClosedByPipeline } from '@/lib/cohortRecruitment'
import { StudyApplyCta } from './StudyApplyCta'
import { StudyCohortFullWaitlist } from './StudyCohortFullWaitlist'
import { CohortQualificationSection } from './CohortQualificationSection'

const RUST = '#C84B2F'
/** Trust footer + other dark panels */
const DARK_PANEL_BG = '#1a1f2e'
/** Section 1 (hero) & section 3 — matches BioStackr logo white */
const HERO_LIGHT_BG = '#FFFFFF'
/** Section 2 — slightly darker band vs hero */
const STUDY_SECTION_BAND_BG = '#F2F3F5'
/** Section 4 — same family as band, a touch more off-white */
const STUDY_SECTION_QUAL_BG = '#E9E8E5'
/** Light divider between study stripes */
const STUDY_STRIPE_DIVIDER = 'border-b border-neutral-200/80'

/** Coerce DB / PostgREST cap fields (sometimes string) for hero + capacity checks. */
function readPositiveCap(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'bigint') {
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
  }
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

const DNA_LOGO_WHITE = '/DNA-logo-white.png'
const DNA_LOGO_BLACK = '/DNA-logo-black.png'
/** Same asset as dashboard/marketing headers (`src/app/biostackr/page.tsx`). */
const BIOSTACKR_LOGO = '/BIOSTACKR LOGO 2.png'

/** Subtle noise overlay when no `--cohort-hero-bg` photograph is set. */
const HERO_GRAIN_BG = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.05'/></svg>")`

/** Faint noise for light study sections (white / warm gray). */
const STUDY_LIGHT_NOISE = HERO_GRAIN_BG

function StudySurfaceLight({
  children,
  className = '',
  gradientClass = 'from-neutral-50/85 via-[#faf9f7] to-neutral-100/45',
  /** Solid surface, no noise — optional `surfaceColor` overrides default white */
  continuous = false,
  surfaceColor,
}: {
  children: ReactNode
  className?: string
  /** Tailwind gradient stops for `bg-gradient-to-b`. */
  gradientClass?: string
  continuous?: boolean
  surfaceColor?: string
}) {
  if (continuous) {
    return (
      <div
        className={`relative ${surfaceColor ? '' : 'bg-white'} ${className}`}
        style={surfaceColor ? { backgroundColor: surfaceColor } : undefined}
      >
        {children}
      </div>
    )
  }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.32]"
        style={{ backgroundImage: STUDY_LIGHT_NOISE }}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${gradientClass}`}
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function StepRowConnector() {
  return (
    <div className="flex w-9 shrink-0 select-none flex-col items-center justify-center self-stretch pt-14 text-neutral-300/90 sm:w-11 sm:pt-16">
      <svg width="36" height="20" viewBox="0 0 36 20" fill="none" aria-hidden className="sm:w-10">
        <path
          d="M2 10h22M22 6l6 4-6 4"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      </svg>
    </div>
  )
}

function HeroCohortStatusCard({
  pipelineFilled,
  maxParticipants,
  displayCapacity,
}: {
  /** applied + confirmed rows — same basis as DB enrollment cap and `isCohortEnrollmentClosedByPipeline`. */
  pipelineFilled: number
  /** Operational cap; with displayCapacity: round((pipeline/max)*display) for the public “25 slots” bar. */
  maxParticipants: number | null
  /** Public denominator only (e.g. 25); does not cap real enrollment (maxParticipants does). */
  displayCapacity: number | null
}) {
  const c = Math.max(0, Math.floor(Number(pipelineFilled)))
  const maxP =
    maxParticipants != null && Number.isFinite(Number(maxParticipants)) && Number(maxParticipants) > 0
      ? Math.floor(Number(maxParticipants))
      : null
  const disp =
    displayCapacity != null && Number.isFinite(Number(displayCapacity)) && Number(displayCapacity) > 0
      ? Math.floor(Number(displayCapacity))
      : null

  let displayTotal: number | null = null
  let displayedFilled: number | null = null

  if (maxP != null && disp != null) {
    displayTotal = disp
    const ratio = Math.min(1, Math.max(0, c / maxP))
    displayedFilled = Math.round(ratio * disp)
  } else if (disp != null) {
    displayTotal = disp
    displayedFilled = Math.min(disp, c)
  } else if (maxP != null) {
    displayTotal = maxP
    displayedFilled = Math.min(maxP, c)
  }

  let heroPlacesFilled = displayedFilled ?? c
  if (displayTotal != null) {
    heroPlacesFilled = Math.min(displayTotal, Math.max(0, heroPlacesFilled))
  }

  const pct =
    displayTotal != null && displayTotal > 0
      ? Math.min(100, (heroPlacesFilled / displayTotal) * 100)
      : 0

  return (
    <div
      className="study-hero-anchor relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-[#E5E5E5] px-9 py-9 shadow-[0_20px_56px_-14px_rgba(0,0,0,0.14),0_6px_24px_rgba(0,0,0,0.07),0_0_0_1px_rgba(200,75,47,0.07)] sm:max-w-2xl sm:px-11 sm:py-11"
      style={{ background: '#F2F2F2' }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-2xl bg-gradient-to-b from-white/65 via-white/20 to-transparent"
        aria-hidden
      />
      <div className="relative z-10">
        <p className="text-center text-[19px] font-bold leading-snug text-neutral-900 sm:text-[21px]">
          {displayTotal != null ? (
            <>
              Limited cohort: <span className="tabular-nums">{displayTotal}</span> participants
            </>
          ) : (
            'Limited cohort'
          )}
        </p>
        {displayTotal != null ? (
          <p className="mt-4 text-center text-[24px] font-bold tabular-nums leading-tight text-neutral-900 sm:mt-5 sm:text-[31px]">
            {heroPlacesFilled} participants confirmed so far
          </p>
        ) : null}
        <p
          className={`text-center text-[12px] font-medium leading-relaxed text-neutral-600 sm:text-[13px] ${displayTotal != null ? 'mt-3' : 'mt-2'}`}
        >
          Applications reviewed within 24 hours
        </p>
        {displayTotal != null ? (
          <div className="mt-6 w-full overflow-hidden rounded-full bg-neutral-300 ring-1 ring-neutral-400/25">
            <div
              className="h-[9px] min-w-0 rounded-full transition-[width] duration-1000 ease-out sm:h-[10px]"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(180deg, #d95938 0%, ${RUST} 55%, #a33d24 100%)`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={
                displayTotal != null ? `Cohort progress ${Math.round(pct)} percent` : 'Study capacity'
              }
              role="progressbar"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function IconHowApply() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke={RUST} strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4M4 11h16" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 15l2 2 4-4" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconHowResults() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 19h16" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 15l3-4 3 2 4-6" stroke={RUST} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HowItWorksSteps({
  studyDays,
  outcomeStripVariant,
  cognitiveOutcomeRows,
}: {
  studyDays: number
  outcomeStripVariant: 'sleep' | 'cognitive' | 'generic'
  cognitiveOutcomeRows: { title: string; line: string }[]
}) {
  const checkinStepLine =
    outcomeStripVariant === 'sleep'
      ? 'A quick morning check-in. No wearable required.'
      : 'A quick daily check-in. No wearable required.'

  const steps = [
    {
      step: 'STEP 1',
      icon: <IconHowApply />,
      title: 'Apply for a place in the study',
      line: 'We review applications and confirm selected participants within 24 hours.',
      emphasis: 'light' as const,
    },
    {
      step: 'STEP 2',
      icon: <IconHowCheckin />,
      title: 'Track your results daily',
      line: checkinStepLine,
      emphasis: 'strong' as const,
    },
    {
      step: 'STEP 3',
      icon: <IconHowResults />,
      title: 'See what actually changed for you',
      line: 'A personal report from your own tracked data.',
      emphasis: 'medium' as const,
    },
  ]

  const cardClass = (emphasis: 'light' | 'medium' | 'strong') => {
    const base =
      'flex h-full min-h-0 flex-col rounded-xl border px-7 py-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg'
    if (emphasis === 'light') {
      return `${base} border-neutral-200/70 bg-white/75 shadow-sm hover:shadow-md`
    }
    if (emphasis === 'strong') {
      return `${base} z-[1] border-neutral-200 bg-white shadow-[0_12px_40px_-8px_rgba(26,31,46,0.18)] ring-1 ring-neutral-900/[0.06] hover:shadow-[0_20px_48px_-10px_rgba(26,31,46,0.22)]`
    }
    return `${base} border-neutral-200/90 bg-white/95 shadow-md hover:shadow-xl`
  }

  const renderCard = (s: (typeof steps)[0]) => (
    <div key={s.title} className={cardClass(s.emphasis)}>
      <div className="mb-4 flex h-[3.5rem] w-[3.5rem] shrink-0 items-center justify-center rounded-full bg-[#C84B2F]/[0.12] sm:h-16 sm:w-16">
        {s.icon}
      </div>
      <p
        className="text-[11px] font-semibold tracking-[0.2em] text-neutral-400/90 sm:text-[12px]"
        style={{ fontVariant: 'small-caps' }}
      >
        {s.step}
      </p>
      <h3 className="mt-2 text-[17px] font-bold leading-snug text-neutral-900 sm:text-[18px]">{s.title}</h3>
      <p className="mt-3 text-[13px] leading-relaxed text-neutral-600/80 sm:text-[14px]">{s.line}</p>
    </div>
  )

  return (
    <section
      className={`pt-12 pb-16 sm:pt-14 sm:pb-24 md:pt-16 ${STUDY_STRIPE_DIVIDER}`}
      style={{ backgroundColor: STUDY_SECTION_BAND_BG }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Structured steps, built for real outcomes.
          </p>
          <h2 className="mt-4 text-center text-[22px] font-bold text-neutral-900 sm:text-[24px]">
            How the study works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
            {studyDays} days. Outcomes from your own check-ins.
          </p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-8 sm:grid-cols-3 sm:gap-6">
            {(outcomeStripVariant === 'sleep'
              ? [
                  {
                    title: 'Sleep quality',
                    line: 'See how your sleep actually changes over the study.',
                  },
                  {
                    title: 'Recovery',
                    line: `Track how your nights recover across the ${studyDays} days.`,
                  },
                  {
                    title: 'Next-day energy',
                    line: 'See how you feel the morning after, day by day.',
                  },
                ]
              : outcomeStripVariant === 'cognitive' && cognitiveOutcomeRows.length > 0
                ? cognitiveOutcomeRows
                : [
                    {
                      title: 'Daily signals',
                      line: `Track your study metrics across the ${studyDays} days.`,
                    },
                    {
                      title: 'Personal trajectory',
                      line: 'See how your scores trend from first to last check-in.',
                    },
                    {
                      title: 'Clear takeaway',
                      line: 'A concise summary of what changed for you.',
                    },
                  ]
            ).map((o) => (
              <div key={o.title} className="text-center sm:text-left">
                <h3 className="text-[15px] font-bold text-neutral-900 sm:text-[16px]">{o.title}</h3>
                <p className="mt-2 text-[13px] leading-snug text-neutral-600 sm:text-[14px]">{o.line}</p>
              </div>
            ))}
          </div>
          <div className="relative mt-10 md:mt-12">
            <div
              className="pointer-events-none absolute left-[6%] right-[6%] top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-neutral-200/85 to-transparent md:block"
              aria-hidden
            />
            <div className="hidden items-stretch md:flex md:justify-center">
              {steps.map((s, i) => (
                <Fragment key={s.title}>
                  <div className="flex min-w-0 flex-1 basis-0 max-w-[21rem] flex-col">{renderCard(s)}</div>
                  {i < steps.length - 1 ? <StepRowConnector /> : null}
                </Fragment>
              ))}
            </div>
            <div className="flex flex-col gap-8 md:hidden">
              {steps.map((s) => (
                <Fragment key={s.title}>
                  {renderCard(s)}
                  {s.step !== 'STEP 3' ? (
                    <div className="flex justify-center text-neutral-300">
                      <svg width="20" height="28" viewBox="0 0 20 28" fill="none" aria-hidden>
                        <path
                          d="M10 2v20M6 18l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
      </div>
    </section>
  )
}

/**
 * Partner mark: optional `partnerLogoSrc` from cohort-shaped assets (e.g. cognitive pack);
 * else DNA for DoNotAge-branded cohorts; wordmark text otherwise.
 */
function StudyPartnerHeroLogo({
  brandDisplay,
  partnerLogoSrc,
}: {
  brandDisplay: string
  /** When set (e.g. cognitive cohort asset), overrides DNA/text wordmark. */
  partnerLogoSrc?: string | null
}) {
  const b = String(brandDisplay || '').trim()
  if (partnerLogoSrc) {
    return (
      <Image
        src={partnerLogoSrc}
        alt={b || 'Study partner'}
        width={400}
        height={160}
        className="h-[7.75rem] w-auto max-w-[min(100%,560px)] object-contain object-left sm:h-[8.75rem] md:h-[9.5rem]"
        priority
      />
    )
  }
  if (b && !/donotage/i.test(b)) {
    return (
      <div className="flex min-h-[7.75rem] max-w-[min(100%,560px)] items-center sm:min-h-[8.75rem] md:min-h-[9.5rem]">
        <span className="text-left text-[1.65rem] font-bold leading-tight tracking-tight text-neutral-900 sm:text-[1.85rem] md:text-[2rem]">
          {b}
        </span>
      </div>
    )
  }
  return (
    <Image
      src={DNA_LOGO_BLACK}
      alt={b || 'Study partner'}
      width={200}
      height={200}
      className="h-[7.75rem] w-auto max-w-[min(100%,560px)] object-contain object-left contrast-[1.06] sm:h-[8.75rem] md:h-[9.5rem]"
      priority
    />
  )
}

function HeroBioStackrLogo() {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center self-start bg-transparent transition-opacity hover:opacity-95 sm:self-center"
    >
      {/* multiply: white padding in raster blends into light surfaces */}
      <Image
        src={BIOSTACKR_LOGO}
        alt="BioStackr"
        width={434}
        height={135}
        className="h-[3.75rem] w-auto max-w-[min(100%,340px)] object-contain mix-blend-multiply contrast-[1.04] sm:h-[4.25rem] md:h-[4.7rem]"
        priority
      />
      <span className="sr-only">BioStackr home</span>
    </Link>
  )
}

/** Product visual — pack shot when available; otherwise neutral study-product placeholder. */
function StudyProductPhoto({
  larger,
  imageSrc,
  imageAlt,
}: {
  larger?: boolean
  imageSrc: string
  imageAlt: string
}) {
  const max =
    larger === true
      ? 'max-h-[min(300px,48vw)] sm:max-h-[320px]'
      : 'max-h-[min(260px,44vw)] sm:max-h-[280px]'
  return (
    <div className="flex min-h-[220px] w-full flex-1 items-center justify-center bg-gradient-to-b from-white to-neutral-50 px-4 py-7 sm:min-h-[260px] sm:py-10">
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={1280}
        height={1280}
        sizes="(max-width: 768px) 75vw, 320px"
        className={`h-auto w-auto ${max} max-w-full object-contain drop-shadow-md`}
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
  const depth = highlight
    ? 'ring-2 ring-[#C84B2F]/20 shadow-[0_10px_40px_rgba(200,75,47,0.12)]'
    : 'shadow-[0_12px_40px_-8px_rgba(26,31,46,0.16)] ring-1 ring-neutral-900/[0.06] transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-10px_rgba(26,31,46,0.2)]'
  return (
    <div
      className={`flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border bg-white md:min-h-[448px] ${depth}`}
      style={{ borderColor: highlight ? RUST : '#e5e2dc' }}
    >
      <div className="flex min-h-0 flex-[3] flex-col bg-neutral-50/30">{visual}</div>
      <div className="flex flex-[2] flex-col justify-between px-6 pb-6 pt-5">
        <div>
          <h3 className="text-[17px] font-bold leading-snug text-neutral-900">{title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600/80 sm:text-[14px]">{body}</p>
          {bodyExtra ? (
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-600/80 sm:text-[14px]">{bodyExtra}</p>
          ) : null}
          {tagline ? (
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-500/80 sm:text-[14px]">{tagline}</p>
          ) : null}
        </div>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: RUST }}>
          {footer}
        </p>
      </div>
    </div>
  )
}

/**
 * Third “You’ll receive” card only: BioStackr Pro — always `GENERIC_STUDY_PLACEHOLDER_IMAGE` (/bioshot.png).
 * Do not substitute cohort partner assets here.
 */
function BioStackrRewardPhoto() {
  return (
    <div className="flex min-h-[220px] w-full flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-b from-white to-neutral-50 px-3 py-5 sm:min-h-[260px] sm:gap-5 sm:px-4 sm:py-8">
      <div className="flex w-full shrink-0 justify-center px-1">
        <Link
          href="/"
          className="inline-flex rounded-lg bg-white/95 px-3 py-2 shadow-sm ring-1 ring-neutral-200/70 transition-opacity hover:opacity-90"
        >
          <Image
            src={BIOSTACKR_LOGO}
            alt="BioStackr"
            width={434}
            height={135}
            className="h-9 w-auto max-w-[min(220px,85vw)] object-contain sm:h-10 sm:max-w-[240px]"
          />
          <span className="sr-only">BioStackr home</span>
        </Link>
      </div>
      <Image
        src={GENERIC_STUDY_PLACEHOLDER_IMAGE}
        alt="BioStackr dashboard and outcomes"
        width={1052}
        height={520}
        sizes="(max-width: 768px) 90vw, 360px"
        className="h-auto w-full max-h-[min(200px,40vw)] max-w-full object-contain object-center drop-shadow-md sm:max-h-[min(240px,36vw)]"
      />
    </div>
  )
}

/** Partner completion reward visual (e.g. store credit artwork from `study_landing_reward_config`). */
function PartnerCompletionRewardPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex min-h-[220px] w-full flex-1 items-center justify-center bg-gradient-to-b from-white to-neutral-50 px-3 py-5 sm:min-h-[260px] sm:px-4 sm:py-8">
      <Image
        src={src}
        alt={alt}
        width={1280}
        height={720}
        sizes="(max-width: 768px) 90vw, 360px"
        className="h-auto w-full max-h-[min(260px,44vw)] max-w-full object-contain object-center drop-shadow-md"
      />
    </div>
  )
}

function WhatYouReceive({
  productImageSrc,
  productImageAlt,
  studyDays,
  landingRewards,
}: {
  productImageSrc: string
  productImageAlt: string
  studyDays: number
  landingRewards: ReturnType<typeof resolveStudyLandingRewards>
}) {
  const { summaryLines, packageValueHeadline, packageValueSubline, studyProductCard, completionCard } = landingRewards

  /** Middle card: store credit uses partner hero art only — never the study product image. */
  const completionVisual =
    completionCard.kind === 'store_credit' ? (
      <PartnerCompletionRewardPhoto
        src={completionCard.imagePath}
        alt={completionCard.title}
      />
    ) : (
      <StudyProductPhoto larger imageSrc={productImageSrc} imageAlt={productImageAlt} />
    )

  return (
    <StudySurfaceLight
      continuous
      surfaceColor={HERO_LIGHT_BG}
      className={`py-16 sm:py-24 ${STUDY_STRIPE_DIVIDER}`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-[22px] font-bold text-neutral-900 sm:text-[24px]">
          You&apos;ll receive
        </h2>
        <div className="mx-auto mt-4 max-w-lg text-center text-[15px] font-semibold leading-snug text-neutral-900 sm:text-[16px]">
          <p>{summaryLines[0]}</p>
          <p className="mt-1">{summaryLines[1]}</p>
        </div>
        <p className="mx-auto mt-3 max-w-xl text-center text-[13px] leading-snug text-neutral-600 sm:text-[14px]">
          Delivered when you complete the full {studyDays}-day study.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3 md:items-stretch">
          <IncentiveShelfCard
            visual={<StudyProductPhoto imageSrc={productImageSrc} imageAlt={productImageAlt} />}
            title={studyProductCard.title}
            body={studyProductCard.body}
            footer={studyProductCard.footer}
          />
          <IncentiveShelfCard
            highlight
            visual={completionVisual}
            title={completionCard.title}
            body={completionCard.body}
            footer={completionCard.footer}
          />
          <IncentiveShelfCard
            visual={<BioStackrRewardPhoto />}
            title="3 months of BioStackr Pro"
            body="Full dashboard access and your study outcomes."
            footer="Included"
          />
        </div>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-neutral-200/90 bg-neutral-50 px-5 py-6 text-center shadow-sm sm:mt-12 sm:px-8 sm:py-8">
          <p className="text-[24px] font-bold tabular-nums tracking-tight text-neutral-900 sm:text-[28px]">
            {packageValueHeadline}{' '}
            <span className="text-[15px] font-semibold text-neutral-700 sm:text-base">combined package value</span>
          </p>
          <p className="mt-3 text-[12px] leading-snug text-neutral-600 sm:text-[13px]">{packageValueSubline}</p>
        </div>
      </div>
    </StudySurfaceLight>
  )
}

function TrustFooter({
  partnerBrand,
  partnerLogoSrc,
}: {
  partnerBrand: string
  /** When set, show raster logo instead of DNA asset or plain text (cognitive cohort pack). */
  partnerLogoSrc?: string | null
}) {
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
          {partnerLogoSrc ? (
            <Image
              src={partnerLogoSrc}
              alt={partnerBrand || 'Study partner'}
              width={320}
              height={120}
              className="h-14 w-auto max-w-[min(90vw,280px)] object-contain object-center opacity-95 sm:h-16 md:h-[4.5rem]"
            />
          ) : /donotage/i.test(partnerBrand) ? (
            <Image
              src={DNA_LOGO_WHITE}
              alt={partnerBrand || 'Study partner'}
              width={160}
              height={160}
              className="h-14 w-auto object-contain opacity-90 sm:h-16 md:h-[4.5rem]"
            />
          ) : (
            <span className="text-center text-lg font-bold text-white sm:text-xl">{partnerBrand}</span>
          )}
          <div className="hidden h-14 w-px shrink-0 bg-white/20 sm:block md:h-16" aria-hidden />
          <Link href="/" className="inline-flex opacity-90 transition-opacity hover:opacity-100">
            <Image
              src={BIOSTACKR_LOGO}
              alt="BioStackr"
              width={434}
              height={135}
              className="h-11 w-auto max-w-[min(90vw,320px)] brightness-125 sm:h-12 md:h-14"
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
            `Participant results are anonymised. ${partnerBrand} never sees individual level data.`
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
            "Applying doesn't lock you in."
          )}
        </div>
        <p className="mt-14 text-center text-[11px] text-white/40">
          This study is run by BioStackr on behalf of {partnerBrand} · biostackr.io · GDPR compliant
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
  const cohortRow = cohort as Record<string, unknown>
  const maxP = readPositiveCap(cohortRow.max_participants)
  const displayCap = readPositiveCap(cohortRow.display_capacity)

  if (displayCap != null && maxP == null) {
    console.warn(
      '[study] cohort has display_capacity but max_participants missing — hero cannot scale proportionally; set cohorts.max_participants (see migration 20260430150000). slug=',
      slug,
    )
  }

  const pipelineCount = await countCohortPipelineParticipants(cohortId)
  /**
   * Enrollment closed = pipeline (applied + confirmed) ≥ max_participants — same rule as DB trigger.
   * Hero “X of 25” uses the same pipeline count scaled into display_capacity (urgency bar only).
   */
  const capacityFull = isCohortEnrollmentClosedByPipeline(maxP, pipelineCount)
  const showFullMessage = capacityFull || String(statusParam || '').toLowerCase() === 'full'

  const productName = String(cohort.product_name || 'Study product')
  const brandName = String(cohort.brand_name || '')
  const brandDisplay = brandName.trim() || 'Study partner'
  const cohortStatus = String(cohortRow.status || 'draft').trim().toLowerCase()
  /** Only `active` shows the full application form; `draft` is preview-only (intentional). */
  const enrollmentOpen = cohortStatus === 'active'
  const studyDays =
    typeof cohortRow.study_days === 'number' && Number.isFinite(cohortRow.study_days) && cohortRow.study_days > 0
      ? Math.floor(cohortRow.study_days)
      : 21

  const normalizedCheckinFields = normalizeCohortCheckinFields(cohortRow.checkin_fields)
  const isSleepShapedCohort = isSleepShapedCheckinFields(normalizedCheckinFields)
  const isCognitiveShapedCohort = isCognitiveShapedCheckinFields(normalizedCheckinFields)
  const cognitiveOutcomeRows = isCognitiveShapedCohort
    ? cognitiveOutcomeStripForStudyPage(normalizedCheckinFields)
    : []

  const outcomeSecondaryLine = isSleepShapedCohort
    ? `Track measurable changes in your sleep over ${studyDays} days with simple daily check-ins.`
    : isCognitiveShapedCohort
      ? `Track measurable changes in your focus and cognitive performance over ${studyDays} days with simple daily check-ins.`
      : `Track measurable changes during your ${studyDays}-day study with simple daily check-ins.`

  /** Imagery from cohort shape only (`checkin_fields`): sleep pack, cognitive Seeking Health asset pack, or generic placeholder. */
  const partnerLogoSrc = isCognitiveShapedCohort ? COGNITIVE_COHORT_STUDY_ASSETS.partnerLogo : null
  const productHeroImageSrc = isSleepShapedCohort
    ? SLEEP_PACK_PRODUCT_IMAGE
    : isCognitiveShapedCohort
      ? COGNITIVE_COHORT_STUDY_ASSETS.productImage
      : GENERIC_STUDY_PLACEHOLDER_IMAGE
  const productHeroImageAlt = productName
  const qualificationShape: 'sleep' | 'cognitive' = isSleepShapedCohort ? 'sleep' : 'cognitive'

  const landingRewards = resolveStudyLandingRewards({
    cohortRow,
    brandDisplay,
    productName,
    studyDays,
    defaultStoreCreditVisualPath: COGNITIVE_COHORT_STUDY_ASSETS.rewardHero,
    isCognitiveShapedCohort,
  })

  return (
    <div className="flex flex-1 flex-col text-neutral-900">
      <div className="flex flex-1 flex-col">
      <section
        className={`relative w-full overflow-hidden px-4 pb-11 pt-10 sm:px-6 sm:pb-12 sm:pt-12 md:pt-14 ${STUDY_STRIPE_DIVIDER}`}
        style={{ backgroundColor: HERO_LIGHT_BG }}
      >
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <StudyPartnerHeroLogo brandDisplay={brandDisplay} partnerLogoSrc={partnerLogoSrc} />
            <HeroBioStackrLogo />
          </div>

          <div className="mx-auto mt-12 max-w-2xl text-center sm:mt-16 md:mt-[4.25rem]">
            <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-neutral-800 sm:text-[13px]">
              Private study invitation
            </p>
            <div className="mt-4 flex flex-col items-center">
              <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight text-neutral-900 sm:text-[44px] md:text-[48px]">
                {productName}
              </h1>
              <p className="mt-0.5 text-[15px] font-semibold text-neutral-900 sm:text-[16px]">by {brandDisplay}</p>
            </div>
            <p className="mt-2 text-[13px] font-normal leading-snug text-neutral-600 sm:mt-2.5 sm:text-[14px]">
              {studyDays}-day customer outcomes study
            </p>

            {!showFullMessage ? (
              <div className="mt-4 sm:mt-5">
                <HeroCohortStatusCard
                  pipelineFilled={pipelineCount}
                  maxParticipants={maxP}
                  displayCapacity={displayCap}
                />
              </div>
            ) : (
              <div
                className="relative mx-auto mt-4 flex max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] px-8 py-6 text-center text-neutral-700 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] sm:mt-5 sm:py-8"
                role="status"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/55 to-transparent"
                  aria-hidden
                />
                <span className="relative z-10 text-[17px] font-semibold text-neutral-900 sm:text-[18px]">
                  This study is now full.
                </span>
                <p className="relative z-10 mx-auto mt-3 max-w-lg text-[14px] font-normal leading-relaxed text-neutral-700 sm:text-[15px]">
                  Leave your email and we&apos;ll contact you if a spot opens or when we run our next study.
                </p>
                <StudyCohortFullWaitlist cohortSlug={slug} />
              </div>
            )}

            <div className="mx-auto mt-3 max-w-xl space-y-1.5 text-center text-[17px] leading-[1.48] text-neutral-800 sm:mt-3.5 sm:text-[17px]">
              <p className="font-medium text-neutral-800">
                {brandDisplay} is working with BioStackr to measure how {productName} performs in real customers.
              </p>
              <p className="text-neutral-700">{outcomeSecondaryLine}</p>
            </div>

            {!showFullMessage ? (
              <p className="mx-auto mt-4 max-w-xl px-1 text-center text-[15px] font-semibold leading-snug text-neutral-900 sm:mt-5 sm:text-[16px]">
                Finish the full {studyDays}-day study and your combined rewards are worth over{' '}
                <span className="whitespace-nowrap" style={{ color: RUST }}>
                  {landingRewards.packageValueHeadline}
                </span>
                .
              </p>
            ) : null}

            {!showFullMessage && enrollmentOpen ? (
              <div className="mt-4 flex flex-col items-center sm:mt-5">
                <StudyApplyCta variant="heroLight" />
                <p className="mt-4 max-w-md px-2 text-center text-[12px] font-medium leading-snug text-neutral-600 sm:mt-5 sm:text-[13px]">
                  Limited availability — applications reviewed within 24 hours
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {!showFullMessage ? (
        <>
          <HowItWorksSteps
            studyDays={studyDays}
            outcomeStripVariant={
              isSleepShapedCohort ? 'sleep' : isCognitiveShapedCohort ? 'cognitive' : 'generic'
            }
            cognitiveOutcomeRows={cognitiveOutcomeRows}
          />
          <WhatYouReceive
            productImageSrc={productHeroImageSrc}
            productImageAlt={productHeroImageAlt}
            studyDays={studyDays}
            landingRewards={landingRewards}
          />
          <StudySurfaceLight
            continuous
            surfaceColor={STUDY_SECTION_QUAL_BG}
            className="py-16 sm:py-24"
          >
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
              <CohortQualificationSection
                cohortSlug={cohort.slug}
                cohortBrandName={brandName}
                productName={productName}
                cohortCapacityFull={capacityFull}
                enrollmentOpen={enrollmentOpen}
                qualificationShape={qualificationShape}
                studyDays={studyDays}
              />
            </div>
          </StudySurfaceLight>
        </>
      ) : null}
      </div>

      <TrustFooter partnerBrand={brandDisplay} partnerLogoSrc={partnerLogoSrc} />
    </div>
  )
}
