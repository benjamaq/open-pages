import { sendEmail } from '@/lib/email/resend'

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendCohortStudyStartEmail(params: {
  to: string
  productName: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const product = escapeHtml(params.productName)
  const subject = 'Your 21-day study begins today — first check-in'
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a1a;padding:24px;max-width:560px;">
<p>Your <strong>${product}</strong> study officially starts today.</p>
<p>Open your <strong>BioStackr dashboard</strong> now and complete your <strong>first daily check-in</strong>. It only takes a moment.</p>
<p>We will send your morning reminder from tomorrow at the time you chose in settings.</p>
<p style="margin-top:24px;color:#555;font-size:14px;">— BioStackr</p>
</body></html>`
  return sendEmail({ to, subject, html })
}
