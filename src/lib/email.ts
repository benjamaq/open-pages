// Email utility functions for contact form
// This is a placeholder implementation - you'll need to integrate with an actual email service

interface ContactEmailData {
  name: string
  email: string
  subject: string
  category: string
  message: string
  submissionId: string
  userId?: string
}

interface AutoReplyEmailData {
  email: string
  name: string
}

interface WelcomeEmailData {
  email: string
  name: string
  slug: string
}

interface EmailData {
  to: string
  subject: string
  html: string
}

interface FollowerNotificationData {
  ownerName: string
  ownerSlug: string
  message: string
  followerEmail: string
}

interface CreatorConfirmationData {
  ownerName: string
  followersNotified: number
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  console.log('📧 Contact form submission received:', {
    submissionId: data.submissionId,
    userId: data.userId,
    name: data.name,
    email: data.email,
    subject: data.subject,
    category: data.category,
    message: data.message.substring(0, 100) + '...'
  })

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email send')
    return
  }

  try {
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const template = emailTemplates.contactForm(data)
    
    await resend.emails.send({
      from: 'noreply@biostackr.io',
      to: 'ben09@mac.com',
      subject: template.subject,
      html: template.html
    })
    
    console.log('✅ Contact email sent successfully')
  } catch (error) {
    console.error('❌ Failed to send contact email:', error)
    throw error
  }
}

export async function sendAutoReplyEmail(data: AutoReplyEmailData): Promise<void> {
  console.log('📧 Auto-reply email would be sent to:', data.email, 'for user:', data.name)
  
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping auto-reply email')
    return
  }

  try {
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const template = emailTemplates.autoReply(data)
    
    await resend.emails.send({
      from: 'noreply@biostackr.io',
      to: data.email,
      subject: template.subject,
      html: template.html
    })
    
    console.log('✅ Auto-reply email sent successfully')
  } catch (error) {
    console.error('❌ Failed to send auto-reply email:', error)
    throw error
  }
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  console.log('📧 Sending welcome email to:', data.email)

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping welcome email')
    return
  }

  try {
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const template = emailTemplates.welcome(data)
    
    // Use Resend's onboarding domain if no custom domain is configured
    // To use your own domain, add RESEND_FROM_EMAIL to environment variables
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    
    const emailPayload = {
      from: `Ben from BioStackr <${fromEmail}>`,
      to: data.email,
      subject: template.subject,
      html: template.html,
      replyTo: 'ben09@mac.com'
    }
    
    console.log('📧 Sending welcome email with payload:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      replyTo: emailPayload.replyTo
    })
    
    const result = await resend.emails.send(emailPayload)
    console.log('✅ Resend API response:', result)
    
    console.log('✅ Welcome email sent successfully to:', data.email)
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
    // Don't throw - we don't want signup to fail if email fails
    console.error('Welcome email error details:', error)
  }
}

// Email templates
export const emailTemplates = {
  contactForm: (data: ContactEmailData) => ({
    subject: `[${data.category.toUpperCase()}] ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
        </div>
        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          <strong>Submission ID:</strong> ${data.submissionId}<br>
          <strong>User ID:</strong> ${data.userId || 'Not logged in'}<br>
          <strong>Timestamp:</strong> ${new Date().toISOString()}
        </p>
      </div>
    `
  }),
  
  autoReply: (data: AutoReplyEmailData) => ({
    subject: 'Thank you for contacting Biostackr',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank you for contacting Biostackr!</h2>
        <p>Hi ${data.name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p>If you have any urgent questions, please don't hesitate to reach out.</p>
        <br>
        <p>Best regards,<br>The Biostackr Team</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          This is an automated response. Please do not reply to this email.
        </p>
      </div>
    `
  }),
  
  welcome: (data: WelcomeEmailData) => ({
    subject: 'Welcome to BioStackr 👋',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="margin-bottom: 24px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            Hey ${data.name},
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            Thanks for trying BioStackr!
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            <strong>Quick tip:</strong> the real magic happens after 5-7 days of tracking when patterns start to emerge in your monthly heatmap. Don't worry about perfection - just log your check-in daily (takes 10 seconds) and the patterns will show themselves.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            If anything is confusing or you hit any issues, just reply to this email. I read every message.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
            -Ben
          </p>
        </div>
        
        <div style="background: #f9fafb; border-left: 3px solid #4f46e5; padding: 16px; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong style="color: #374151;">P.S.</strong> Your shareable link is always available in the top nav - send it to your doctor before appointments so they can see what's been happening.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://biostackr.io/dash" style="display: inline-block; background: #111827; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Go to Dashboard
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
            You're receiving this because you signed up for BioStackr. If you didn't create this account, please contact us immediately.
          </p>
        </div>
      </div>
    `
  })
}

// Generic email sending function
export async function sendEmail(data: EmailData): Promise<boolean> {
  console.log('📧 Sending email to:', data.to)
  
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email send')
    return false
  }

  try {
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: 'noreply@biostackr.io',
      to: data.to,
      subject: data.subject,
      html: data.html
    })
    
    console.log('✅ Email sent successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}

// Follower notification email
export function createFollowerNotificationEmail(
  ownerName: string,
  ownerSlug: string,
  message: string,
  followerEmail: string
): EmailData {
  return {
    to: followerEmail,
    subject: `${ownerName} shared an update on their stack`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Update from ${ownerName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #1a202c 0%, #4c1d95 100%); color: white; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
          .logo { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 18px; margin-bottom: 24px; color: #2d3748; }
          .update-box { background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; position: relative; }
          .update-box::before { content: ''; }
          .update-text { font-style: italic; font-size: 16px; line-height: 1.6; color: #4a5568; margin: 0; }
          .cta { text-align: center; margin: 32px 0; }
          .cta-button { display: inline-block; background: #1a202c; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s; }
          .cta-button:hover { background: #2d3748; transform: translateY(-1px); }
          .footer { background: #f7fafc; padding: 24px; text-align: center; font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; }
          .footer a { color: #4c1d95; text-decoration: none; font-weight: 500; }
          .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">BioStackr</div>
            <p>New Update from ${ownerName}</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hi there!
            </div>
            
            <p style="color: #4a5568; margin-bottom: 24px;">
              <strong>${ownerName}</strong> just shared an update on their health stack:
            </p>
            
            <div class="update-box">
              <p class="update-text">"${message}"</p>
            </div>
            
            <div class="cta">
              <a href="https://biostackr.io/biostackr/${ownerSlug}" class="cta-button">
                View Full Stack
              </a>
            </div>
            
            <div class="divider"></div>
            
            <p style="color: #718096; font-size: 14px; text-align: center; margin: 0;">
              Stay updated with ${ownerName}'s wellness journey
            </p>
          </div>

          <div class="footer">
            <p>
              This email was sent because you're following ${ownerName}'s stack on BioStackr.
            </p>
            <p style="margin-top: 16px; font-size: 12px;">
              <a href="https://biostackr.io/unsubscribe">Unsubscribe</a> | 
              <a href="https://biostackr.io">BioStackr</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

// Creator confirmation email
export function createCreatorConfirmationEmail(
  ownerName: string,
  followersNotified: number,
  creatorEmail: string
): EmailData {
  return {
    to: creatorEmail,
    subject: `Update sent to ${followersNotified} follower(s)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Update Sent Successfully</h2>
        <p>Hi ${ownerName},</p>
        <p>Your update has been sent to ${followersNotified} follower(s).</p>
        <p>Keep sharing your health journey!</p>
        <br>
        <p>Best regards,<br>The Biostackr Team</p>
      </div>
    `
  }
}