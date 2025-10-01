import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Resend configuration')
    
    // Check environment variables
    const apiKey = process.env.RESEND_API_KEY
    const domain = process.env.RESEND_DOMAIN
    
    console.log('RESEND_API_KEY exists:', !!apiKey)
    console.log('RESEND_DOMAIN:', domain)
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY not configured',
        apiKeyExists: false
      }, { status: 500 })
    }
    
    // Test Resend client initialization
    const resend = new Resend(apiKey)
    console.log('Resend client created successfully')
    
    // Try to send a simple test email
    console.log('Attempting to send test email...')
    const result = await resend.emails.send({
      from: 'notifications@biostackr.io',
      to: 'ben09@me.com',
      subject: 'Resend Debug Test',
      html: '<h1>Debug Test</h1><p>This is a debug test email.</p>'
    })
    
    console.log('Resend API response:', result)
    
    return NextResponse.json({
      success: true,
      apiKeyExists: true,
      domain: domain,
      resendResponse: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Resend debug failed:', error)
    return NextResponse.json({ 
      error: 'Resend debug failed', 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
