import { NextRequest, NextResponse } from 'next/server'
import { sendDailyReminder } from '../../../lib/email/resend'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Manual email test triggered for me.com')
    
    // Test data
    const testData: any = {
      userName: 'Test User',
      userEmail: 'ben09@me.com', // Your me.com email
      supplements: [
        { name: 'Vitamin D', dose: '2000 IU', timing: 'morning' },
        { name: 'Omega-3', dose: '1000mg', timing: 'with food' }
      ],
      protocols: [
        { name: 'Cold shower', frequency: 'daily' },
        { name: 'Intermittent fasting', frequency: '16:8' }
      ],
      movement: [
        { name: 'Morning walk', duration: '30 min' },
        { name: 'Strength training', duration: '45 min' }
      ],
      mindfulness: [
        { name: 'Meditation', duration: '10 min' },
        { name: 'Breathing exercises', duration: '5 min' }
      ],
      profileUrl: `https://biostackr.io/dash`,
      unsubscribeUrl: `https://biostackr.io/dash/settings`
    }
    
    console.log('📧 Sending test email to:', testData.userEmail)
    
    // Send the test email
    await sendDailyReminder(testData)
    
    console.log('✅ Test email sent successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent to ben09@me.com',
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Test email failed:', error)
    return NextResponse.json({ 
      error: 'Test email failed', 
      details: error.message 
    }, { status: 500 })
  }
}
