import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Resend API directly...')
    
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        success: false,
        error: 'RESEND_API_KEY not configured'
      }, { status: 500 })
    }

    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    console.log('🧪 Resend client created')
    
    // Try to send a simple test email using the verified domain
    const testPayload = {
      from: process.env.RESEND_FROM || 'BioStackr <reminders@biostackr.io>',
      to: 'ben09@mac.com',
      subject: 'Test from BioStackr',
      html: '<p>This is a test email from BioStackr to verify Resend is working.</p>'
    }
    
    console.log('🧪 Sending test email with payload:', testPayload)
    
    const result = await resend.emails.send(testPayload)
    console.log('🧪 Resend API response:', result)
    
    if (result.error) {
      console.error('❌ Resend API error:', result.error)
      return NextResponse.json({ 
        success: false,
        error: 'Resend API error',
        details: result.error
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Test email sent successfully',
      emailId: result.data?.id,
      fullResponse: result
    })
    
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || String(error)
    }, { status: 500 })
  }
}
