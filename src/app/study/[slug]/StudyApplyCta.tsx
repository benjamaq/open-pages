'use client'

export function StudyApplyCta({
  className = '',
  variant = 'default',
}: {
  cohortSlug?: string
  className?: string
  /** hero: light outline on dark background */
  variant?: 'default' | 'hero'
}) {
  const scrollToForm = () => {
    try {
      const el = document.getElementById('cohort-apply-form')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch {}
  }

  const heroCls =
    'inline-flex items-center justify-center rounded-full border border-white/35 bg-white/5 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10'
  const defaultCls =
    'inline-flex items-center justify-center rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800'

  const base = variant === 'hero' ? heroCls : defaultCls
  const merged = className ? `${base} ${className}` : base

  return (
    <button type="button" onClick={scrollToForm} className={merged}>
      Apply for a place in the study
    </button>
  )
}
