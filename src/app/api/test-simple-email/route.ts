import { NextRequest, NextResponse } from 'next/server'
import { sendDailyReminder } from '../../../../lib/email/resend'

export async function GET(req: Request) {
  try {
    console.log('🧪 Simple email test started')
    
    const testData = {
      userName: 'Test User',
      userEmail: 'ben09@mac.com', // Use your verified email
      supplements: [
        { name: 'Vitamin D', dose: '2000 IU', timing: 'morning' },
        { name: 'Omega-3', dose: '1000mg', timing: 'with food' }
      ],
      protocols: [{ name: 'Intermittent Fasting', frequency: 'daily' }],
      movement: [{ name: 'Morning Walk', duration: '30 min' }],
      mindfulness: [{ name: 'Meditation', duration: '15 min' }],
      profileUrl: 'https://biostackr.io/dash',
      unsubscribeUrl: 'https://biostackr.io/dash/settings'
    }
    
    console.log('📧 Sending test email to:', testData.userEmail)
    const result = await sendDailyReminder(testData)
    console.log('📧 Email result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent',
      result: result
    })
    
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json({ 
      error: 'Test email failed', 
      details: error.message 
    }, { status: 500 })
  }
}
