import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail, sendNewFollowerNotification, sendEmail } from '../../../lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const { type, email, ownerName } = await request.json()
    
    console.log('🧪 Testing email:', { type, email, ownerName })

    let result

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(email, ownerName || 'Test User')
        break
      
      case 'new-follower':
        result = await sendNewFollowerNotification(email, ownerName || 'Test User', 5)
        break
      
      case 'test':
        result = await sendEmail({
          to: email,
          subject: '🧪 NEW TEST EMAIL from BioStackr',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
              <div style="background: linear-gradient(135deg, #1a202c 0%, #4c1d95 100%); color: white; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🧪 NEW TEST EMAIL</h1>
                <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">BioStackr Email System Test</p>
              </div>
              <div style="padding: 32px 24px; background: white; border-radius: 0 0 12px 12px;">
                <div style="background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                  <h3 style="color: #1a202c; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">
                    ✅ Email System Working!
                  </h3>
                  <p style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.6;">
                    This is the NEW beautiful test email format. If you received this, your email notifications are working perfectly! 🎉
                  </p>
                </div>
                <div style="background: #f7fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
                  <h3 style="color: #1a202c; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Test Details:</h3>
                  <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li><strong>Type:</strong> ${type}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Owner:</strong> ${ownerName || 'Test User'}</li>
                    <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                    <li><strong>Format:</strong> NEW Beautiful Design ✨</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 32px 0;">
                  <p style="color: #718096; font-size: 14px; margin: 0;">
                    This email was sent from the updated BioStackr email system.
                  </p>
                </div>
              </div>
            </div>
          `
        })
        break
      
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    console.log('📧 Email test result:', result)

    return NextResponse.json({
      success: result.success,
      messageId: result.id,
      error: result.error
    })

  } catch (error) {
    console.error('❌ Email test error:', error)
    return NextResponse.json({ 
      error: 'Email test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
