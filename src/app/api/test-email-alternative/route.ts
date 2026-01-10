import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    console.log('🧪 Testing alternative email delivery to:', email)

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Try sending from a different verified domain if available
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || 'BioStackr <reminders@biostackr.io>',
      to: email,
      subject: '🔍 Alternative Email Test - Custom Domain',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a202c;">🔍 Alternative Email Test</h1>
          <p>This email is sent from the custom domain <strong>noreply@biostacker.io</strong> instead of notifications@biostackr.io</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> noreply@biostacker.io</p>
          <p><strong>To:</strong> ${email}</p>
          <p>If you receive this, the custom domain delivery works!</p>
        </div>
      `
    })

    console.log('📧 Alternative email result:', result)

    if (result.error) {
      console.error('❌ Alternative email failed:', result.error)
      
      // Fallback to reminders@biostackr.io
      console.log('🔄 Trying fallback with reminders@biostackr.io...')
      
      const fallbackResult = await resend.emails.send({
        from: process.env.RESEND_FROM || 'BioStackr <reminders@biostackr.io>',
        to: email,
        subject: '🔍 Fallback Email Test - Resend Domain',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a202c;">🔍 Fallback Email Test</h1>
            <p>This email is sent from the fallback domain <strong>${process.env.RESEND_FROM || 'BioStackr <reminders@biostackr.io>'}</strong></p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>From:</strong> ${process.env.RESEND_FROM || 'BioStackr <reminders@biostackr.io>'}</p>
            <p><strong>To:</strong> ${email}</p>
            <p>If you receive this, the fallback delivery works!</p>
          </div>
        `
      })
      
      console.log('📧 Fallback email result:', fallbackResult)
      
      if (fallbackResult.error) {
        return NextResponse.json({ 
          error: `Both custom domain and fallback failed: ${fallbackResult.error.message}` 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        messageId: fallbackResult.data?.id,
        message: 'Fallback email sent successfully!',
        method: 'fallback'
      })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.data?.id,
      message: 'Custom domain email sent successfully!',
      method: 'custom-domain'
    })

  } catch (error) {
    console.error('❌ Error in alternative email test:', error)
    return NextResponse.json({ 
      error: `Failed to send alternative test email: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
