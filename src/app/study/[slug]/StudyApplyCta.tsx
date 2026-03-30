'use client'

export function StudyApplyCta({
  className = '',
}: {
  cohortSlug?: string
  className?: string
}) {
  const scrollToForm = () => {
    try {
      const el = document.getElementById('cohort-apply-form')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={scrollToForm}
      className={
        className ||
        'inline-flex items-center justify-center rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors'
      }
    >
      Apply now
    </button>
  )
}
