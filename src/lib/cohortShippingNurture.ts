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
        `Your spot in the <strong>${study}</strong> study is confirmed and your product is being dispatched by <strong>${brand}</strong>. When your product arrives, open your BioStackr dashboard and tap <strong>My product has arrived — start my study</strong>. Your 21 days begin that day—complete your first check-in right after. Until it arrives, there is nothing you need to do.`,
      ]
      break
    case 'day7':
      paragraphs = [
        `Your <strong>${product}</strong> should be arriving any day now. When it arrives, open your BioStackr dashboard and use <strong>My product has arrived — start my study</strong>, then complete your first check-in. Daily check-ins take about 30 seconds; reminders start the morning after you start. Questions? Reply to this email.`,
      ]
      break
    case 'day10':
      paragraphs = [
        `If your <strong>${product}</strong> has arrived, open the dashboard and tap <strong>My product has arrived — start my study</strong>, then complete your first check-in. If it has not arrived yet, reply to this email and we will look into it.`,
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
