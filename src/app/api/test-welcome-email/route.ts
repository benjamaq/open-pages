import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { sendWelcomeEmail } from '../../../lib/email'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: userError?.message 
      }, { status: 401 })
    }

    // Get profile for slug
    const { data: profile } = await supabase
      .from('profiles')
      .select('slug, display_name')
      .eq('user_id', user.id)
      .single()

    console.log('🧪 Test welcome email - User:', user.email)
    console.log('🧪 Test welcome email - Profile:', profile)
    console.log('🧪 RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)

    // Try to send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email!,
        name: profile?.display_name || user.email!.split('@')[0],
        slug: profile?.slug || 'your-profile'
      })

      return NextResponse.json({ 
        success: true,
        message: 'Welcome email sent successfully',
        details: {
          to: user.email,
          name: profile?.display_name || user.email!.split('@')[0],
          slug: profile?.slug,
          resendConfigured: !!process.env.RESEND_API_KEY
        }
      })
    } catch (emailError: any) {
      console.error('❌ Email send error:', emailError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to send email',
        details: emailError.message || String(emailError),
        resendConfigured: !!process.env.RESEND_API_KEY
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || String(error)
    }, { status: 500 })
  }
}
