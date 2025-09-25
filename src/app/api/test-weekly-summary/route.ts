import { NextRequest, NextResponse } from 'next/server'
import { sendWeeklySummaryEmail } from '../../../lib/actions/notifications'

// POST /api/test-weekly-summary - Test weekly summary email
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing weekly summary email...')
    
    await sendWeeklySummaryEmail()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Weekly summary test completed! Check console for results.' 
    })

  } catch (error) {
    console.error('Weekly summary test error:', error)
    return NextResponse.json({ 
      error: 'Failed to test weekly summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
