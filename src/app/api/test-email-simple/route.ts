import { NextRequest, NextResponse } from 'next/server'
import { sendDailyReminder } from '../../../lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    // Simple test email with mock data
    const emailData = {
      userName: 'Test User',
      userEmail: 'ben09@mac.com',
      supplements: [
        { name: 'Vitamin D', dose: '1000 IU', timing: 'morning' },
        { name: 'Magnesium', dose: '400mg', timing: 'evening' }
      ],
      protocols: [
        { name: 'Morning routine', frequency: 'daily' }
      ],
      movement: [
        { name: 'Morning walk', duration: '30 min' }
      ],
      mindfulness: [
        { name: 'Meditation', duration: '15 min' }
      ],
      profileUrl: 'https://www.biostackr.io/dash',
      unsubscribeUrl: 'https://www.biostackr.io/unsubscribe'
    }

    console.log('📧 Sending simple test email with data:', emailData)
    
    const result = await sendDailyReminder(emailData)

    console.log('📧 Simple test email result:', result)

    if (!result.success) {
      console.error('❌ Simple test email failed:', result.error)
      return NextResponse.json({ 
        error: result.error || 'Failed to send test email' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.id,
      message: 'Simple test email sent successfully!' 
    })

  } catch (error) {
    console.error('❌ Error in simple test email API:', error)
    return NextResponse.json({ 
      error: `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
