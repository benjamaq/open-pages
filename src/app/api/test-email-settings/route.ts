import { NextRequest, NextResponse } from 'next/server'
import { sendDailyReminder } from '../../../lib/email/resend'
import { createClient } from '../../../lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's profile and data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        stack_items:stack_items(*),
        protocols:protocols(*)
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user's items
    const supplements = (profile as any).stack_items?.filter((item: any) => 
      !item.name?.toLowerCase().includes('movement') && 
      !item.name?.toLowerCase().includes('mindfulness')
    ) || []

    const protocols = (profile as any).protocols || []

    const movement = (profile as any).stack_items?.filter((item: any) => 
      item.name?.toLowerCase().includes('movement') || 
      item.name?.toLowerCase().includes('exercise')
    ) || []

    const mindfulness = (profile as any).stack_items?.filter((item: any) => 
      item.name?.toLowerCase().includes('mindfulness') || 
      item.name?.toLowerCase().includes('meditation')
    ) || []

    // Send test email
    const emailData = {
      userName: (profile as any).display_name || (profile as any).name || 'User',
      userEmail: user.email!,
      supplements: supplements.map((item: any) => ({
        name: item.name || 'Unknown supplement',
        dose: item.dose || '',
        timing: item.timing || item.time_preference || 'anytime'
      })),
      protocols: protocols.map((item: any) => ({
        name: item.name || 'Unknown protocol',
        frequency: item.frequency || 'daily'
      })),
      movement: movement.map((item: any) => ({
        name: item.name || 'Unknown movement',
        duration: item.dose || '30 min'
      })),
      mindfulness: mindfulness.map((item: any) => ({
        name: item.name || 'Unknown mindfulness',
        duration: item.dose || '15 min'
      })),
      profileUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dash`,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe`
    }

    console.log('📧 Sending test email with data:', emailData)
    
    const result = await sendDailyReminder(emailData)

    console.log('📧 Test email result:', result)

    if (!result.success) {
      console.error('❌ Test email failed:', result.error)
      return NextResponse.json({ 
        error: result.error || 'Failed to send test email' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.id,
      message: 'Test email sent successfully!' 
    })

  } catch (error) {
    console.error('❌ Error in test email API:', error)
    return NextResponse.json({ 
      error: `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
