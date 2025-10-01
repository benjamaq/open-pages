import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '../../../lib/email/resend'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Simple email test triggered')
    
    const result = await sendEmail({
      to: 'ben09@me.com',
      subject: 'Simple Test Email',
      html: '<h1>Test Email</h1><p>This is a simple test email to check if basic email sending works.</p>'
    })
    
    console.log('📧 Simple email result:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Simple test email sent',
      result: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Simple email test failed:', error)
    return NextResponse.json({ 
      error: 'Simple email test failed', 
      details: error.message 
    }, { status: 500 })
  }
}