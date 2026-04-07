import { escapeHtml } from '@/lib/cohortTransactionalEmailHtml'

/**
 * Partner physical reward copy — keep centralized when fulfilment wording changes.
 * Product name comes from cohorts.product_name.
 */
export function cohortPartnerSupplyFulfillmentHtml(params: {
  partnerBrand: string
  productName: string
}): string {
  const partnerEsc = escapeHtml(params.partnerBrand.trim() || 'Study partner')
  const productEsc = escapeHtml(params.productName.trim() || 'your study product')
  const partnerPlain = params.partnerBrand.trim() || 'Study partner'
  return (
    `<p style="margin:0 0 12px;"><strong>${partnerEsc}</strong> has included a <strong>3-month supply</strong> of <strong>${productEsc}</strong> as a thank-you for completing the study.</p>` +
    `<p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">${escapeHtml(partnerPlain)} will follow up with delivery details shortly.</p>`
  )
}

export function cohortPartnerSupplyFulfillmentText(params: { partnerBrand: string; productName: string }): string {
  const partner = params.partnerBrand.trim() || 'Study partner'
  const product = params.productName.trim() || 'your study product'
  return `${partner} has included a 3-month supply of ${product} as a thank-you for completing the study. ${partner} will follow up with delivery details shortly.`
}
