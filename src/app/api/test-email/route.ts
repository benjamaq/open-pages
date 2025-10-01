import { NextRequest, NextResponse } from 'next/server'
import { sendDailyReminder } from '../../../lib/email/resend'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Manual email test triggered')
    
    // Test data
    const testData = {
      userName: 'Test User',
      userEmail: 'findbenhere@gmail.com', // Your email
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
      ]
    }
    
    console.log('📧 Sending test email to:', testData.userEmail)
    
    // Send the test email with proper data structure
    const emailData = {
      userName: testData.userName,
      userEmail: testData.userEmail,
      supplements: testData.supplements,
      protocols: testData.protocols,
      movement: testData.movement,
      mindfulness: testData.mindfulness,
      profileUrl: 'https://biostackr.io/dash',
      unsubscribeUrl: 'https://biostackr.io/dash/settings'
    }
    
    console.log('📧 Sending test email with data:', emailData)
    await sendDailyReminder(emailData)
    
    console.log('✅ Test email sent successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent to findbenhere@gmail.com',
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