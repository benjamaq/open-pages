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
          subject: 'Test Email from BioStackr',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #667eea;">Test Email from BioStackr</h1>
              <p>This is a test email to verify that the email system is working correctly.</p>
              <p>If you received this email, your email notifications are working! 🎉</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>Type: ${type}</li>
                <li>Email: ${email}</li>
                <li>Owner: ${ownerName || 'Test User'}</li>
                <li>Timestamp: ${new Date().toISOString()}</li>
              </ul>
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
