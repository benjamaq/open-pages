import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const hasResendKey = !!process.env.RESEND_API_KEY
    const resendKeyPreview = process.env.RESEND_API_KEY 
      ? `${process.env.RESEND_API_KEY.substring(0, 8)}...` 
      : 'NOT SET'
    
    // Test if we can load Resend
    let resendAvailable = false
    try {
      const { Resend } = require('resend')
      resendAvailable = true
    } catch (error) {
      resendAvailable = false
    }

    return NextResponse.json({
      status: 'Contact form configuration',
      resendApiKey: {
        configured: hasResendKey,
        preview: resendKeyPreview
      },
      resendLibrary: {
        available: resendAvailable
      },
      recipientEmail: 'ben09@mac.com',
      senderEmail: 'noreply@biostackr.io',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check contact configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

