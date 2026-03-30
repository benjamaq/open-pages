'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  setCohortCookie,
  setCohortBrandCookie,
  COHORT_QUALIFICATION_STORAGE_KEY,
  type CohortQualificationDraftV1,
} from '@/lib/cohort'

const PRESCRIBE_EXIT =
  'Thanks for your interest — for this study we need participants not currently on prescription sleep medication. We hope to include you in a future study.'

const CURRENT_PRODUCT_EXIT =
  'Thanks for your interest — this study needs participants with a clean baseline, which means not currently taking the product. We hope to include you in a future study.'

const BORDER_SUBTLE = '#d4cfc8'
const BORDER_SELECTED = '#1a1a1a'

const pillOuterClass =
  'flex w-full flex-col gap-3 sm:flex-row sm:gap-3'

function selectorButtonClass(selected: boolean): string {
  const base =
    'w-full rounded-[8px] px-5 py-3 text-left text-[14px] leading-snug font-normal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2'
  if (selected) {
    return `${base} text-white`
  }
  return `${base} bg-white text-neutral-900`
}

function selectorButtonStyle(selected: boolean): CSSProperties {
  return {
    border: `1.5px solid ${selected ? BORDER_SELECTED : BORDER_SUBTLE}`,
    padding: '12px 20px',
    fontSize: 14,
    background: selected ? BORDER_SELECTED : '#fff',
    color: selected ? '#fff' : undefined,
  }
}

export function CohortQualificationSection({
  cohortSlug,
  cohortBrandName,
  productName,
}: {
  cohortSlug: string
  cohortBrandName: string
  productName: string
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
    setCohortBrandCookie(cohortBrandName)
    try {
      const draft: CohortQualificationDraftV1 = { v: 1, cohortSlug: slug, issue: issue.trim() }
      sessionStorage.setItem(COHORT_QUALIFICATION_STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // still proceed; signup page will redirect if draft missing
    }
    router.push('/signup/cohort')
  }

  const productLabel = String(productName || '').trim() || 'this product'

  if (hardExit) {
    return (
      <section id="cohort-apply-form" className="scroll-mt-24">
        <div
          className="rounded-xl border bg-white px-6 py-8 sm:px-8"
          style={{
            borderColor: '#e5e2dc',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            borderRadius: 12,
          }}
        >
          <p className="text-sm text-neutral-700 leading-relaxed">{hardExit}</p>
        </div>
      </section>
    )
  }

  return (
    <section id="cohort-apply-form" className="scroll-mt-24">
      <h2 className="text-center text-[22px] font-semibold text-neutral-900">Apply for a spot</h2>

      <div
        className="mx-auto mt-8 max-w-[680px] rounded-xl border bg-white"
        style={{
          borderColor: '#e5e2dc',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderRadius: 12,
          padding: 40,
        }}
      >
        <form onSubmit={onSubmit} className="block" noValidate>
          <div className="mb-7">
            <label htmlFor="cohort-issue" className="block text-sm font-medium text-neutral-800">
              What is the main issue you&apos;re hoping this supplement will help with? Please be specific.
            </label>
            <p className="mt-1.5 text-[13px] font-normal leading-snug text-[#888]">
              This helps us identify the best fit for the study. Be specific — the more detail you give, the stronger
              your application.
            </p>
            <div className="relative mt-2">
              <textarea
                id="cohort-issue"
                name="issue"
                rows={4}
                value={issue}
                onChange={(e) => {
                  setIssue(e.target.value)
                  setIssueError(null)
                }}
                onBlur={() => setIssueTouched(true)}
                placeholder="e.g. I wake up around 3am and can't get back to sleep."
                className="min-h-[100px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pb-7 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
              <p className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-[#888]">
                Minimum 20 characters
              </p>
            </div>
            <p className="mt-2 text-[12px] italic leading-relaxed" style={{ color: '#999' }}>
              The more specific you are, the stronger your application. Vague answers are less likely to be selected.
            </p>
            {issueTouched && issueError && <p className="mt-1.5 text-sm text-red-600">{issueError}</p>}
          </div>

          <div className="mb-7">
            <div className="text-sm font-medium text-neutral-800">
              Are you currently taking {productLabel}?
            </div>
            <div className={pillOuterClass + ' mt-3'}>
              <button
                type="button"
                className={selectorButtonClass(currentProduct === 'no')}
                style={selectorButtonStyle(currentProduct === 'no')}
                onClick={() => {
                  setCurrentProduct('no')
                  setCurrentProductError(false)
                }}
              >
                No, I&apos;m not currently taking it
              </button>
              <button
                type="button"
                className={selectorButtonClass(currentProduct === 'yes')}
                style={selectorButtonStyle(currentProduct === 'yes')}
                onClick={() => {
                  setCurrentProduct('yes')
                  setCurrentProductError(false)
                }}
              >
                Yes, I&apos;m currently taking it
              </button>
            </div>
            {currentProductError && <p className="mt-2 text-sm text-red-600">Please answer this question to continue.</p>}
          </div>

          <div className="mb-7">
            <div className="text-sm font-medium text-neutral-800">
              Are you currently taking prescription medication for sleep?
            </div>
            <div className={pillOuterClass + ' mt-3'}>
              <button
                type="button"
                className={selectorButtonClass(prescription === 'no')}
                style={selectorButtonStyle(prescription === 'no')}
                onClick={() => {
                  setPrescription('no')
                  setPrescError(false)
                }}
              >
                No
              </button>
              <button
                type="button"
                className={selectorButtonClass(prescription === 'yes')}
                style={selectorButtonStyle(prescription === 'yes')}
                onClick={() => {
                  setPrescription('yes')
                  setPrescError(false)
                }}
              >
                Yes — this would disqualify me
              </button>
            </div>
            {prescError && <p className="mt-2 text-sm text-red-600">Please answer this question to continue.</p>}
          </div>

          <div className="mb-7">
            <label
              htmlFor="cohort-commitment"
              className="flex w-full cursor-pointer gap-3 rounded-[8px] p-4 text-left text-sm leading-relaxed text-neutral-800 transition-colors focus-within:ring-2 focus-within:ring-neutral-900 focus-within:ring-offset-2"
              style={{
                border: `1.5px solid ${commitment ? BORDER_SELECTED : BORDER_SUBTLE}`,
                background: commitment ? '#f0f7ee' : '#fff',
                padding: 16,
              }}
            >
              <input
                id="cohort-commitment"
                type="checkbox"
                className="sr-only"
                checked={commitment}
                onChange={(e) => setCommitment(e.target.checked)}
                required
              />
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border text-sm font-semibold leading-none"
                style={{
                  borderColor: commitment ? BORDER_SELECTED : BORDER_SUBTLE,
                  background: commitment ? 'rgba(255,255,255,0.6)' : '#fff',
                  color: commitment ? BORDER_SELECTED : '#9ca3af',
                }}
                aria-hidden
              >
                {commitment ? '✓' : '☐'}
              </span>
              <span>
                I can complete a 30-second check-in each morning for 21 days, starting with 2 check-ins in the next 48
                hours.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-[8px] bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Submit my application
          </button>
          <p className="mt-4 text-center text-[13px] leading-relaxed text-neutral-500 sm:text-left">
            Applications are reviewed within 24 hours. You&apos;ll receive a confirmation by email.
          </p>
        </form>
      </div>
    </section>
  )
}
