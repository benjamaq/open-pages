'use client'

/**
 * Terminal state for cohort_participants.status = 'dropped': not the study dashboard,
 * not the B2C stack product.
 */
export function CohortDroppedHoldScreen({
  brandName,
  productName,
}: {
  brandName?: string | null
  productName?: string | null
}) {
  const brand = typeof brandName === 'string' ? brandName.trim() : ''
  const product =
    typeof productName === 'string' && productName.trim() !== ''
      ? productName.trim()
      : 'this study'
  const studyLabel =
    brand && product !== 'this study' ? `${brand} — ${product}` : product !== 'this study' ? product : 'this study'

  return (
    <div
      className="rounded-3xl border border-slate-200 bg-white px-6 py-10 sm:px-10 sm:py-12 text-slate-900 shadow-[0_12px_48px_-20px_rgba(15,23,42,0.18),0_4px_14px_-6px_rgba(15,23,42,0.08)]"
      role="status"
    >
      <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">You are no longer in this study</h1>
      <p className="mt-4 text-[15px] sm:text-[1.0625rem] leading-relaxed text-slate-700 max-w-prose">
        Your participation in <span className="font-medium text-slate-900">{studyLabel}</span> has ended. The standard
        BioStackr dashboard (supplements, stack, and daily loops) is not available while your account is in this
        state.
      </p>
      <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-prose">
        If you think this is a mistake, contact the study team or support using the same email you used to join.
      </p>
    </div>
  )
}
