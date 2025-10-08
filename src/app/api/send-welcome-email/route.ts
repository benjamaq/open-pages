import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { sendWelcomeEmail } from '../../../lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, slug } = await request.json()

    // Send welcome email
    await sendWelcomeEmail({
      email: user.email!,
      name: name || user.email!.split('@')[0],
      slug: slug || 'your-profile'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    // Return success anyway - don't block user flow if email fails
    return NextResponse.json({ success: true, warning: 'Email may not have sent' })
  }
}
