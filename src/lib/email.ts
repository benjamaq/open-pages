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
      from: 'noreply@biostackr.com',
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
      from: 'noreply@biostackr.com',
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
      from: 'noreply@biostackr.com',
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Update from ${ownerName}</h2>
        <p>Hi there!</p>
        <p>${ownerName} just shared an update on their health stack:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-style: italic;">"${message}"</p>
        </div>
        <p>Check out their full stack at: <a href="https://biostackr.io/${ownerSlug}">biostackr.io/${ownerSlug}</a></p>
        <br>
        <p>Best regards,<br>The Biostackr Team</p>
      </div>
    `
  }
}

// Creator confirmation email
export function createCreatorConfirmationEmail(
  ownerName: string,
  followersNotified: number
): EmailData {
  return {
    to: 'creator@example.com', // This should be the creator's email
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