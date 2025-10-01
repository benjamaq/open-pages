import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '../../../lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    console.log('🧪 Testing simple template email to:', email)

    const result = await sendEmail({
      to: email,
      subject: '🧪 SIMPLE TEST EMAIL',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a202c;">🧪 SIMPLE TEST EMAIL</h1>
          <p>This is a simple test email with basic HTML.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> notifications@biostackr.io</p>
          <p><strong>To:</strong> ${email}</p>
          <p>If you receive this, the simple template works!</p>
        </div>
      `
    })

    console.log('📧 Simple template result:', result)

    if (!result.success) {
      console.error('❌ Simple template failed:', result.error)
      return NextResponse.json({ 
        error: result.error || 'Failed to send simple test email' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.id,
      message: 'Simple template test email sent successfully!' 
    })

  } catch (error) {
    console.error('❌ Error in simple template test:', error)
    return NextResponse.json({ 
      error: `Failed to send simple test email: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
