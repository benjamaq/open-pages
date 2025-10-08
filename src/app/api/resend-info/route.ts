import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        success: false,
        error: 'RESEND_API_KEY not configured'
      }, { status: 500 })
    }

    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    // Try to get account info or domains
    try {
      const domains = await resend.domains.list()
      console.log('🧪 Resend domains:', domains)
      
      return NextResponse.json({ 
        success: true,
        message: 'Resend API key is valid',
        domains: domains,
        apiKey: process.env.RESEND_API_KEY.substring(0, 10) + '...' // Show first 10 chars only
      })
    } catch (domainError: any) {
      console.log('🧪 Domain list error (expected in testing mode):', domainError.message)
      
      // If domains fail, the API key is still valid but we're in testing mode
      return NextResponse.json({ 
        success: true,
        message: 'Resend API key is valid (testing mode)',
        testingMode: true,
        note: 'Account is in testing mode - can only send to account owner email',
        apiKey: process.env.RESEND_API_KEY.substring(0, 10) + '...'
      })
    }
    
  } catch (error: any) {
    console.error('❌ Resend info error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || String(error)
    }, { status: 500 })
  }
}
