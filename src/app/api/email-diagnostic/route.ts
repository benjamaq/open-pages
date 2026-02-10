import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const hasApiKey = !!process.env.RESEND_API_KEY
    const hasDomain = !!process.env.RESEND_DOMAIN
    
    console.log('🔍 Email Diagnostic Check:')
    console.log('RESEND_API_KEY exists:', hasApiKey)
    console.log('RESEND_DOMAIN exists:', hasDomain)
    console.log('RESEND_DOMAIN value:', process.env.RESEND_DOMAIN || 'NOT SET')
    
    // Test Resend client creation
    let resendClient = null
    let clientError = null
    
    try {
      resendClient = new Resend(process.env.RESEND_API_KEY)
      console.log('✅ Resend client created successfully')
    } catch (error) {
      clientError = error
      console.error('❌ Failed to create Resend client:', error)
    }
    
    // Test sending a simple email
    let testResult = null
    let testError = null
    
    if (resendClient) {
      try {
        const result = await resendClient.emails.send({
          from: process.env.RESEND_FROM || 'BioStackr <reminders@biostackr.io>',
          to: 'ben09@mac.com',
          subject: '🔍 Email Diagnostic Test',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a202c;">🔍 Email Diagnostic Test</h1>
              <p>This is a diagnostic test email to check if the email system is working.</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>From:</strong> ${process.env.RESEND_FROM || 'BioStackr <reminders@biostackr.io>'}</p>
              <p><strong>To:</strong> ben09@mac.com</p>
            </div>
          `
        })
        
        testResult = result
        console.log('✅ Test email sent successfully:', result)
      } catch (error) {
        testError = error
        console.error('❌ Failed to send test email:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      diagnostic: {
        environment: {
          hasApiKey,
          hasDomain,
          domainValue: process.env.RESEND_DOMAIN || 'NOT SET'
        },
        client: {
          created: !!resendClient,
          error: (clientError as any)?.message || null
        },
        testEmail: {
          sent: !!testResult,
          result: testResult,
          error: (testError as any)?.message || null
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error)
    return NextResponse.json({ 
      error: 'Diagnostic failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
