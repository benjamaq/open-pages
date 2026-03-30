'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { setCohortCookie } from '@/lib/cohort'

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
  const [ageOk, setAgeOk] = useState(false)
  const [commitOk, setCommitOk] = useState(false)
  const [accurateOk, setAccurateOk] = useState(false)
  const canContinue = ageOk && commitOk && accurateOk

  const onContinue = () => {
    if (!canContinue) return
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
          A few quick confirmations before we create your account.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <label className="flex gap-3 items-start cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={ageOk}
              onChange={(e) => setAgeOk(e.target.checked)}
            />
            <span className="text-sm text-neutral-800">I am 18 or older and legally able to join this study.</span>
          </label>
          <label className="flex gap-3 items-start cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={commitOk}
              onChange={(e) => setCommitOk(e.target.checked)}
            />
            <span className="text-sm text-neutral-800">
              I can complete a short daily check-in for the study period (about 30–60 seconds per day).
            </span>
          </label>
          <label className="flex gap-3 items-start cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={accurateOk}
              onChange={(e) => setAccurateOk(e.target.checked)}
            />
            <span className="text-sm text-neutral-800">
              I understand this is a real-world outcomes study, not medical advice, and I will answer honestly.
            </span>
          </label>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
