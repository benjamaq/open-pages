import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { countCohortConfirmedParticipants, isCohortCapacityFull } from '@/lib/cohortRecruitment'
import { StudyApplyCta } from './StudyApplyCta'
import { CohortQualificationSection } from './CohortQualificationSection'

const RUST = '#C84B2F'
const HERO_BG = '#0f1117'

function SpotCounterCard({
  confirmed,
  max,
  capacityFull,
}: {
  confirmed: number
  max: number | null
  capacityFull: boolean
}) {
  const maxNum = max != null && Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : null
  const remaining =
    maxNum != null ? Math.max(0, maxNum - confirmed) : null
  const pct =
    maxNum != null && maxNum > 0 ? Math.min(100, (confirmed / maxNum) * 100) : capacityFull ? 100 : 0

  return (
    <div
      className="mx-auto w-full max-w-md rounded-xl border border-white/20 px-5 py-4"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start gap-2 text-left text-sm text-white/90">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: RUST }} aria-hidden />
        <p>
          <span className="font-semibold tabular-nums">{confirmed}</span> confirmed spots filled
          {remaining != null ? (
            <>
              {' '}
              · <span className="font-semibold tabular-nums">{remaining}</span> remaining
            </>
          ) : null}
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${pct}%`, background: RUST }}
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

function WhatYouReceive({ productName }: { productName: string }) {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-[22px] font-semibold text-neutral-900">What participants receive</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div
            className="rounded-xl bg-white p-6 shadow-sm"
            style={{ borderLeft: `2px solid ${RUST}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="mb-3 h-px w-24" style={{ background: RUST }} />
            <h3 className="text-[15px] font-semibold text-neutral-900">{productName} for the full 21 days</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
              Shipped to you before tracking begins.
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">Supplied by DoNotAge.</p>
            {/* Product image — replace with Image once asset arrives */}
            <div
              className="mt-6 flex h-32 items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-50"
              style={{ borderColor: '#e5e2dc' }}
            >
              <span className="text-[11px] text-neutral-400">Product image</span>
            </div>
          </div>
          <div
            className="rounded-xl bg-white p-6 shadow-sm"
            style={{ borderLeft: `2px solid ${RUST}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="mb-3 h-px w-24" style={{ background: RUST }} />
            <h3 className="text-[15px] font-semibold text-neutral-900">£45–50 DoNotAge store credit</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
              Awarded on completion of all 21 check-ins.
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">Use on any product.</p>
            <div
              className="mt-6 flex h-32 items-center justify-center rounded-md border border-dashed bg-neutral-50"
              style={{ borderColor: '#e5e2dc' }}
              aria-hidden
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={RUST} strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="10" width="18" height="11" rx="1" />
                <path d="M12 10V21" />
                <path d="M3 10h18" />
                <path d="M8 10c0-3 2.5-5 4-5s4 2 4 5" />
              </svg>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-[13px] leading-relaxed text-neutral-600">
          All participants also receive 3 months of BioStackr Pro — the supplement tracking platform running this
          study. Value: included.
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
    <footer className="py-14 sm:py-16" style={{ background: HERO_BG }}>
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

  const confirmedCount = await countCohortConfirmedParticipants(cohortId)
  const capacityFull = isCohortCapacityFull(maxP, confirmedCount)
  const showFullMessage = capacityFull || String(statusParam || '').toLowerCase() === 'full'

  const studyDays = typeof cohort.study_days === 'number' ? cohort.study_days : 21
  const productName = String(cohort.product_name || 'Study product')
  const brandName = String(cohort.brand_name || '')

  return (
    <div className="min-h-screen text-neutral-900">
      {/* Section 1 — Hero */}
      <section className="w-full px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-8" style={{ background: HERO_BG }}>
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
            <p className="mt-2 text-[18px] text-white/60 sm:text-[20px]">Customer Outcomes Study</p>
            <div className="mx-auto mt-8 flex justify-center">
              <div className="h-px w-[60px]" style={{ background: RUST }} />
            </div>

            {!showFullMessage ? (
              <div className="mt-10">
                <SpotCounterCard confirmed={confirmedCount} max={maxP} capacityFull={capacityFull} />
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

            <p className="mx-auto mt-10 max-w-[480px] text-center text-base leading-relaxed text-white">
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
              <CohortQualificationSection cohortSlug={cohort.slug} cohortBrandName={brandName} />
            </div>
          </section>
        </>
      ) : null}

      <TrustFooter />
    </div>
  )
}
