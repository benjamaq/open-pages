'use client'

import { useRouter } from 'next/navigation'
export function StudyApplyCta({
  cohortSlug,
  className = '',
}: {
  cohortSlug: string
  className?: string
}) {
  const router = useRouter()

  const goApply = () => {
    const slug = String(cohortSlug || '').trim().toLowerCase()
    if (!slug) {
      router.push('/signup')
      return
    }
    router.push(`/study/${encodeURIComponent(slug)}/apply`)
  }

  return (
    <button
      type="button"
      onClick={goApply}
      className={
        className ||
        'inline-flex items-center justify-center rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors'
      }
    >
      Sign up to apply
    </button>
  )
}
