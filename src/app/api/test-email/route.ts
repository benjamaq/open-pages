import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '../../../lib/email/resend'
import { createAdminClient } from '../../../utils/supabase/admin'

export async function GET(request: NextRequest) {
  return handleTestEmail(request)
}

export async function POST(request: NextRequest) {
  return handleTestEmail(request)
}

async function handleTestEmail(request: NextRequest) {
  try {
    console.log('🧪 Manual email test triggered')
    
    // Try to get user email from request body (for POST requests)
    let userEmail = 'findbenhere@gmail.com' // Default fallback
    try {
      const body = await request.json()
      if (body.email) {
        userEmail = body.email
      }
    } catch (e) {
      // Ignore JSON parsing errors for GET requests
    }
    
    console.log('📧 Sending test email to:', userEmail)
    
    // Send a simple test email instead of a daily reminder
    const testEmailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email from Biostackr</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 32px 24px; }
          .success { background: #d4edda; color: #155724; padding: 16px; border-radius: 8px; margin: 16px 0; }
          .footer { background: #f7fafc; padding: 24px; text-align: center; font-size: 14px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Biostackr</h1>
          </div>
          
          <div class="content">
            <div class="success">
              <strong>✅ Test Email Successful!</strong>
            </div>
            
            <h2>Your email settings are working correctly!</h2>
            <p>This is a test email to confirm that your email notifications are set up properly.</p>
            
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Email sent to: ${userEmail}</li>
              <li>Timestamp: ${new Date().toLocaleString()}</li>
              <li>Domain: notifications@biostackr.io</li>
            </ul>
            
            <p>You should receive daily reminder emails at your scheduled time.</p>
          </div>
          
          <div class="footer">
            <p>This is a test email from Biostackr</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    try {
      const result = await sendEmail({
        to: userEmail,
        subject: '✅ Biostackr Test Email - Settings Working!',
        html: testEmailHTML
      })
      console.log('📧 Email send result:', result)
      
      if (result.success) {
        console.log('✅ Test email sent successfully')
      } else {
        console.error('❌ Email send failed:', result.error)
        throw new Error(result.error || 'Email send failed')
      }
    } catch (error) {
      console.error('❌ Error sending test email:', error)
      throw error
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${userEmail}`,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Test email failed:', error)
    return NextResponse.json({ 
      error: 'Test email failed', 
      details: error.message 
    }, { status: 500 })
  }
}