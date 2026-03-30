'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { setCohortCookie } from '@/lib/cohort'

/*
 * QUESTIONS TO BE FINALISED — see brief.
 * Stub only: exact copy, number of questions, and format (e.g. checkboxes vs free text)
 * will be defined after research. Do not treat placeholder UI as production eligibility logic.
 */

export default function StudyQualificationForm({
  cohortSlug,
  brandName,
  productName,
}: {
  cohortSlug: string
  brandName: string
  productName: string
}) {
  const router = useRouter()

  const onContinue = () => {
    const slug = String(cohortSlug || '').trim().toLowerCase()
    if (!slug) {
      router.push('/signup')
      return
    }
    setCohortCookie(slug)
    router.push('/signup')
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] text-neutral-900">
      <header className="border-b border-neutral-200 bg-white/90">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4 sm:px-6">
          <Link href={`/study/${encodeURIComponent(cohortSlug)}`} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            ← Back to study
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Apply — {brandName} · {productName}</h1>
        <p className="mt-3 text-neutral-700 text-sm leading-relaxed">
          Next step: qualification (content pending research).
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
          Eligibility questions will go here. Routing below sets the cohort cookie and sends you to sign up — same as the
          future &quot;pass&quot; path once real questions exist.
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
          >
            Continue to sign up
          </button>
          <p className="text-xs text-neutral-500 text-center">
            You&apos;ll create a BioStackr account next. Your spot stays pending until you pass the check-in compliance step.
          </p>
        </div>
      </main>
    </div>
  )
}
