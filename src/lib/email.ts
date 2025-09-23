// Simple email service for notifications
// In production, you'd integrate with SendGrid, Resend, AWS SES, etc.

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // For now, just log the email to console
    // In production, replace this with actual email service
    console.log('📧 EMAIL SENT:', {
      to: emailData.to,
      subject: emailData.subject,
      preview: emailData.html.substring(0, 200) + '...'
    })
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export function createFollowerNotificationEmail(
  creatorName: string,
  creatorSlug: string,
  message: string,
  followerEmail: string
): EmailData {
  const subject = `${creatorName} updated their stack`
  const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3009'}/u/${creatorSlug}?public=true`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0F1115; margin-bottom: 16px;">${creatorName} updated their stack</h2>
      
      ${message ? `<p style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0; font-style: italic;">"${message}"</p>` : ''}
      
      <p style="color: #5C6370; margin-bottom: 24px;">
        Check out their latest changes and see what's new in their health stack.
      </p>
      
      <a href="${profileUrl}" 
         style="background: #0F1115; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">
        View Stack
      </a>
      
      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #5C6370; font-size: 14px; margin: 0;">
          <strong>📅 Weekly Digest:</strong> Every Sunday at 5pm, you'll receive a complete summary of all changes to ${creatorName}'s stack, including any updates not covered in instant notifications.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      
      <p style="color: #9ca3af; font-size: 14px;">
        You're receiving this because you follow ${creatorName}'s stack. 
        <a href="#" style="color: #6b7280;">Unsubscribe</a> | 
        <a href="#" style="color: #6b7280;">Manage preferences</a>
      </p>
    </div>
  `
  
  const text = `${creatorName} updated their stack${message ? `: "${message}"` : ''}. View their stack at: ${profileUrl}`
  
  return {
    to: followerEmail,
    subject,
    html,
    text
  }
}

export function createCreatorConfirmationEmail(
  creatorName: string,
  followersNotified: number
): EmailData {
  const subject = `Update sent to ${followersNotified} follower${followersNotified !== 1 ? 's' : ''}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0F1115; margin-bottom: 16px;">Update sent successfully!</h2>
      
      <p style="color: #5C6370; margin-bottom: 24px;">
        Your stack update has been sent to <strong>${followersNotified} follower${followersNotified !== 1 ? 's' : ''}</strong>.
      </p>
      
      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #0c4a6e; margin: 0; font-size: 14px;">
          <strong>Note:</strong> You can only send 1 instant notification per day to each follower. 
          Other changes will be included in the daily digest.
        </p>
      </div>
      
      <p style="color: #5C6370; font-size: 14px;">
        Thanks for keeping your followers updated!
      </p>
    </div>
  `
  
  const text = `Your stack update has been sent to ${followersNotified} follower${followersNotified !== 1 ? 's' : ''}.`
  
  return {
    to: 'creator@example.com', // In production, get from user profile
    subject,
    html,
    text
  }
}
