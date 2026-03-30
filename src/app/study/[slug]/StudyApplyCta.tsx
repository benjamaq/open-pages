'use client'

import { useRouter } from 'next/navigation'
import { setCohortCookie } from '@/lib/cohort'

export function StudyApplyCta({
  cohortSlug,
  className = '',
}: {
  cohortSlug: string
  className?: string
}) {
  const router = useRouter()

  const goSignup = () => {
    const slug = String(cohortSlug || '').trim()
    if (!slug) {
      router.push('/signup')
      return
    }
    setCohortCookie(slug)
    router.push('/signup')
  }

  return (
    <button
      type="button"
      onClick={goSignup}
      className={
        className ||
        'inline-flex items-center justify-center rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors'
      }
    >
      Sign up to apply
    </button>
  )
}
