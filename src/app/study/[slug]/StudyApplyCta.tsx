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
    'inline-flex items-center justify-center rounded-full border-2 border-white/55 bg-white/[0.14] px-10 py-[0.95rem] text-[15px] font-bold tracking-wide text-white shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/75 hover:bg-white/[0.22] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_28px_rgba(200,75,47,0.35)] active:translate-y-0 sm:px-11 sm:py-4 sm:text-base'
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
