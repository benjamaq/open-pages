'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setCohortCookie, COHORT_QUALIFICATION_STORAGE_KEY, type CohortQualificationDraftV1 } from '@/lib/cohort'

const PRESCRIBE_EXIT =
  'Thanks for your interest — for this study we need participants not currently on prescription sleep medication. We hope to include you in a future study.'

const CURRENT_PRODUCT_EXIT =
  'Thanks for your interest — this study needs participants with a clean baseline, which means not currently taking the product. We hope to include you in a future study.'

export function CohortQualificationSection({
  cohortSlug,
}: {
  cohortSlug: string
}) {
  const router = useRouter()
  const [issue, setIssue] = useState('')
  const [issueTouched, setIssueTouched] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<'yes' | 'no' | ''>('')
  const [prescription, setPrescription] = useState<'yes' | 'no' | ''>('')
  const [commitment, setCommitment] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [currentProductError, setCurrentProductError] = useState(false)
  const [prescError, setPrescError] = useState(false)
  const [hardExit, setHardExit] = useState<string | null>(null)

  const issueOk = issue.trim().length >= 20

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setHardExit(null)
    setIssueError(null)
    setCurrentProductError(false)
    setPrescError(false)

    if (!issueOk) {
      setIssueError('Please be a little more specific — this helps us match you to the right study.')
      setIssueTouched(true)
      return
    }
    if (currentProduct === '') {
      setCurrentProductError(true)
      return
    }
    if (currentProduct === 'yes') {
      setHardExit(CURRENT_PRODUCT_EXIT)
      return
    }
    if (prescription === '') {
      setPrescError(true)
      return
    }
    if (prescription === 'yes') {
      setHardExit(PRESCRIBE_EXIT)
      return
    }
    if (!commitment) return

    const slug = String(cohortSlug || '').trim().toLowerCase()
    if (!slug) {
      router.push('/signup/cohort')
      return
    }
    setCohortCookie(slug)
    try {
      const draft: CohortQualificationDraftV1 = { v: 1, cohortSlug: slug, issue: issue.trim() }
      sessionStorage.setItem(COHORT_QUALIFICATION_STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // still proceed; signup page will redirect if draft missing
    }
    router.push('/signup/cohort')
  }

  if (hardExit) {
    return (
      <section id="cohort-apply-form" className="mt-12 scroll-mt-24">
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-8">
          <p className="text-sm text-neutral-700 leading-relaxed">{hardExit}</p>
        </div>
      </section>
    )
  }

  return (
    <section id="cohort-apply-form" className="mt-12 scroll-mt-24">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-neutral-900">Apply for this study</h2>

        <div className="mt-6 space-y-2 text-sm text-neutral-600 leading-relaxed">
          <p>Most supplements are built on assumptions, marketing, and guesswork.</p>
          <p>This study is designed to measure what actually changes in real people.</p>
          <p>If you take part, your data contributes to a clearer, more honest understanding of what works and what doesn&apos;t.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-8" noValidate>
          <div>
            <label htmlFor="cohort-issue" className="block text-sm font-medium text-neutral-800">
              What is the main issue you&apos;re hoping this supplement will help with? Please be specific.
            </label>
            <textarea
              id="cohort-issue"
              name="issue"
              rows={2}
              value={issue}
              onChange={(e) => {
                setIssue(e.target.value)
                setIssueError(null)
              }}
              onBlur={() => setIssueTouched(true)}
              placeholder="e.g. I wake up around 3am and can't get back to sleep."
              className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            />
            {issueTouched && issueError && <p className="mt-1.5 text-sm text-red-600">{issueError}</p>}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-neutral-800">Are you currently taking this product?</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-neutral-700">
                <input
                  type="radio"
                  name="current_product"
                  checked={currentProduct === 'no'}
                  onChange={() => {
                    setCurrentProduct('no')
                    setCurrentProductError(false)
                  }}
                  className="text-neutral-900"
                />
                No
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-neutral-700">
                <input
                  type="radio"
                  name="current_product"
                  checked={currentProduct === 'yes'}
                  onChange={() => {
                    setCurrentProduct('yes')
                    setCurrentProductError(false)
                  }}
                  className="text-neutral-900"
                />
                Yes
              </label>
            </div>
            {currentProductError && <p className="text-sm text-red-600">Please answer this question to continue.</p>}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-neutral-800">
              Are you currently taking any prescription medication for sleep?
            </legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-neutral-700">
                <input
                  type="radio"
                  name="prescription_sleep"
                  checked={prescription === 'no'}
                  onChange={() => {
                    setPrescription('no')
                    setPrescError(false)
                  }}
                  className="text-neutral-900"
                />
                No
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-neutral-700">
                <input
                  type="radio"
                  name="prescription_sleep"
                  checked={prescription === 'yes'}
                  onChange={() => {
                    setPrescription('yes')
                    setPrescError(false)
                  }}
                  className="text-neutral-900"
                />
                Yes
              </label>
            </div>
            {prescError && <p className="text-sm text-red-600">Please answer this question to continue.</p>}
          </fieldset>

          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={commitment}
                onChange={(e) => setCommitment(e.target.checked)}
                className="mt-1 text-neutral-900"
                required
              />
              <span>
                I can complete a 30-second check-in each morning for 21 days, starting with 2 check-ins in the next 48
                hours.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            Continue to create your account
          </button>
        </form>
      </div>
    </section>
  )
}
