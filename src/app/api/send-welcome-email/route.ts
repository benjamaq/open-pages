import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { sendWelcomeEmail } from '../../../lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('📧 send-welcome-email - Auth check:', {
      hasUser: !!user,
      userEmail: user?.email,
      error: userError?.message
    })
    
    if (userError || !user) {
      console.error('❌ send-welcome-email - Unauthorized:', userError)
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: userError?.message || 'No user session found'
      }, { status: 401 })
    }

    const { name, slug } = await request.json()
    
    console.log('📧 send-welcome-email - Payload:', { name, slug, email: user.email })
    
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured')
      return NextResponse.json({ 
        success: false,
        error: 'Email service not configured'
      }, { status: 500 })
    }

    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email!,
        name: name || user.email!.split('@')[0],
        slug: slug || 'your-profile'
      })
      
      console.log('✅ send-welcome-email - Email sent successfully to:', user.email)
      return NextResponse.json({ success: true })
    } catch (emailError: any) {
      console.error('❌ send-welcome-email - Email send failed:', emailError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to send email',
        details: emailError.message || String(emailError)
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ send-welcome-email - Unexpected error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message || String(error)
    }, { status: 500 })
  }
}
