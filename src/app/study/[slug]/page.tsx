import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { countCohortConfirmedParticipants, isCohortCapacityFull } from '@/lib/cohortRecruitment'
import { StudyApplyCta } from './StudyApplyCta'

const FIELD_LABELS: Record<string, string> = {
  sleep_quality: 'Sleep quality',
  energy: 'Energy',
  mood: 'Mood',
  focus: 'Focus',
  sleep_onset_bucket: 'How long it took to fall asleep',
  night_wakes: 'Night wake-ups',
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function StudyLandingPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params
  const { status: statusParam } = await searchParams
  const slug = String(rawSlug || '')
    .trim()
    .toLowerCase()
  if (!slug) notFound()

  const { data: cohort, error } = await supabaseAdmin
    .from('cohorts')
    .select('slug, brand_name, product_name, study_days, checkin_fields, status, max_participants, id')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !cohort) notFound()

  const cohortId = String((cohort as { id: string }).id)
  const maxP = (cohort as { max_participants?: number | null }).max_participants ?? null

  const confirmedCount = await countCohortConfirmedParticipants(cohortId)
  const capacityFull = isCohortCapacityFull(maxP, confirmedCount)
  const showFullMessage = capacityFull || String(statusParam || '').toLowerCase() === 'full'

  const studyDays = typeof cohort.study_days === 'number' ? cohort.study_days : 21
  const rawFields = Array.isArray(cohort.checkin_fields) ? cohort.checkin_fields : []
  const fieldLabels = rawFields.map((k: string) => FIELD_LABELS[String(k)] || String(k))

  return (
    <div className="min-h-screen bg-[#faf9f7] text-neutral-900">
      <header className="border-b border-neutral-200 bg-white/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            ← BioStackr
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {showFullMessage && (
          <div
            className="mb-8 rounded-xl border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-neutral-900"
            role="status"
          >
            This study is now full.
          </div>
        )}

        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Study invitation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {cohort.brand_name} · {cohort.product_name}
        </h1>
        <p className="mt-4 text-lg text-neutral-700 leading-relaxed">
          You&apos;re invited to take part in a short real-world outcomes study on BioStackr.
        </p>

        <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900">What the study involves</h2>
          <ul className="mt-4 space-y-3 text-neutral-700 leading-relaxed list-disc pl-5">
            <li>
              <strong>{studyDays} days</strong> of participation (calendar days on the study timeline).
            </li>
            <li>
              <strong>Daily check-in</strong> — about <strong>30–60 seconds per day</strong> on your phone or
              computer.
            </li>
            {fieldLabels.length > 0 && (
              <li>
                Check-ins cover: <strong>{fieldLabels.join(', ')}</strong>.
              </li>
            )}
            <li>Optional wearable data (Oura, Apple Health, etc.) can complement your check-ins where you connect it.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900">What you receive</h2>
          <ul className="mt-4 space-y-3 text-neutral-700 leading-relaxed list-disc pl-5">
            <li>Access to your BioStackr dashboard for the study period.</li>
            <li>Your check-in history and trends for the outcomes tracked in this study.</li>
            <li>Clear progress and reminders to help you stay on track.</li>
          </ul>
        </section>

        <div className="mt-10">{!showFullMessage ? <StudyApplyCta cohortSlug={cohort.slug} /> : null}</div>
        <p className="mt-6 text-xs text-neutral-500">
          After you sign up, we&apos;ll use your account email to confirm your spot. Complete your first check-in to stay
          enrolled.
        </p>
      </main>
    </div>
  )
}
