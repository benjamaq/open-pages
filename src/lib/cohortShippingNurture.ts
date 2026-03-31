import { sendEmail } from '@/lib/email/resend'

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type ShippingNurtureStep = 'day4' | 'day7' | 'day10'

export function shippingNurtureSubject(step: ShippingNurtureStep): string {
  switch (step) {
    case 'day4':
      return "Your product is on its way — here's what to expect"
    case 'day7':
      return 'Your study starts soon'
    case 'day10':
      return 'Getting close — are you ready?'
    default:
      return 'Update from BioStackr'
  }
}

function wrapHtml(bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a1a;padding:24px;max-width:560px;">${bodyHtml}</body></html>`
}

/** studyName e.g. DoNotAge SureSleep; brandName, productName from cohorts row. */
export function shippingNurtureBodyHtml(
  step: ShippingNurtureStep,
  params: { studyName: string; brandName: string; productName: string },
): string {
  const study = escapeHtml(params.studyName)
  const brand = escapeHtml(params.brandName)
  const product = escapeHtml(params.productName)

  let paragraphs: string[] = []
  switch (step) {
    case 'day4':
      paragraphs = [
        `Your spot in the <strong>${study}</strong> study is confirmed and your product is being dispatched by <strong>${brand}</strong>. While you wait, here is what happens next: your product arrives in the next few days. The morning after it arrives, open BioStackr and complete your first daily check-in. That is the moment your study officially begins. You will get a reminder from us on that day. Nothing to do until then.`,
      ]
      break
    case 'day7':
      paragraphs = [
        `Your <strong>${product}</strong> should be arriving any day now. When it does, your 21-day study begins the next morning. Your daily check-in takes 30 seconds and you will get a reminder at your preferred time each day. If you have any questions before you start, reply to this email.`,
      ]
      break
    case 'day10':
      paragraphs = [
        `If your <strong>${product}</strong> has arrived, your study is about to begin. Complete your first check-in tomorrow morning to get started. If your product has not arrived yet, please reply and we will look into it.`,
      ]
      break
    default:
      paragraphs = ['']
  }

  const inner = paragraphs.map((p) => `<p>${p}</p>`).join('')
  return wrapHtml(inner)
}

export async function sendShippingNurtureEmail(params: {
  to: string
  step: ShippingNurtureStep
  studyName: string
  brandName: string
  productName: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const subject = shippingNurtureSubject(params.step)
  const html = shippingNurtureBodyHtml(params.step, {
    studyName: params.studyName,
    brandName: params.brandName,
    productName: params.productName,
  })
  return sendEmail({ to, subject, html })
}
