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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a202c; text-align: center;">🧪 NEW TEST EMAIL</h1>
              <div style="background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="color: #1a202c; margin: 0 0 12px 0;">✅ Email System Working!</h3>
                <p style="color: #4a5568; margin: 0;">This is the NEW test email format. If you received this, your email notifications are working perfectly! 🎉</p>
              </div>
              <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1a202c; margin: 0 0 15px 0;">Test Details:</h3>
                <ul style="color: #4a5568; margin: 0; padding-left: 20px;">
                  <li><strong>Type:</strong> ${type}</li>
                  <li><strong>Email:</strong> ${email}</li>
                  <li><strong>Owner:</strong> ${ownerName || 'Test User'}</li>
                  <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                  <li><strong>Format:</strong> NEW Simplified Design ✨</li>
                </ul>
              </div>
              <p style="text-align: center; color: #718096; font-size: 14px;">This email was sent from the updated BioStackr email system.</p>
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
