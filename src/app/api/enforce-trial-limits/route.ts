import { NextRequest, NextResponse } from 'next/server'
import { enforceTrialLimits } from '../../../lib/actions/trial-limits'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for this endpoint
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await enforceTrialLimits()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Trial limits enforcement completed' 
    })
  } catch (error) {
    console.error('Error enforcing trial limits:', error)
    return NextResponse.json(
      { error: 'Failed to enforce trial limits' },
      { status: 500 }
    )
  }
}

// Allow GET for testing
export async function GET() {
  try {
    await enforceTrialLimits()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Trial limits enforcement completed (test)' 
    })
  } catch (error) {
    console.error('Error enforcing trial limits:', error)
    return NextResponse.json(
      { error: 'Failed to enforce trial limits' },
      { status: 500 }
    )
  }
}
