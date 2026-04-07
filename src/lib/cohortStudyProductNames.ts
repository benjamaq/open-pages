/** Pure helpers for cohort display names — safe to import from CLI/scripts without Supabase. */
export function studyAndProductNamesFromCohortRow(
  cRow: { product_name?: string | null; brand_name?: string | null } | null | undefined,
): { studyName: string; productName: string } {
  let studyName = 'study'
  let productName = 'product'
  if (!cRow) return { studyName, productName }
  const pn = cRow.product_name
  const bn = cRow.brand_name
  productName = pn != null && String(pn).trim() !== '' ? String(pn).trim() : productName
  const brand = bn != null && String(bn).trim() !== '' ? String(bn).trim() : ''
  studyName = brand ? `${brand} ${productName}` : productName
  return { studyName, productName }
}
