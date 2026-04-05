import { escapeHtml } from '@/lib/cohortTransactionalEmailHtml'

/**
 * DoNotAge / partner physical reward — keep copy centralized for quick edits when fulfilment wording changes.
 * Product name comes from cohorts.product_name (e.g. SureSleep).
 */
export function cohortPartnerSupplyFulfillmentHtml(params: {
  partnerBrand: string
  productName: string
}): string {
  const partnerEsc = escapeHtml(params.partnerBrand.trim() || 'DoNotAge')
  const productEsc = escapeHtml(params.productName.trim() || 'your study product')
  const partnerPlain = params.partnerBrand.trim() || 'DoNotAge'
  return (
    `<p style="margin:0 0 12px;"><strong>${partnerEsc}</strong> has included a <strong>3-month supply</strong> of <strong>${productEsc}</strong> as a thank-you for completing the study.</p>` +
    `<p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">${escapeHtml(partnerPlain)} will follow up with delivery details shortly.</p>`
  )
}

export function cohortPartnerSupplyFulfillmentText(params: { partnerBrand: string; productName: string }): string {
  const partner = params.partnerBrand.trim() || 'DoNotAge'
  const product = params.productName.trim() || 'your study product'
  return `${partner} has included a 3-month supply of ${product} as a thank-you for completing the study. ${partner} will follow up with delivery details shortly.`
}
