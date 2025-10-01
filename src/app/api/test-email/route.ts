import { NextRequest, NextResponse } from 'next/server'
import { sendDailyReminder } from '../../../lib/email/resend'
import { createAdminClient } from '../../../utils/supabase/admin'

export async function GET(request: NextRequest) {
  return handleTestEmail(request)
}

export async function POST(request: NextRequest) {
  return handleTestEmail(request)
}

async function handleTestEmail(request: NextRequest) {
  try {
    console.log('🧪 Manual email test triggered')
    
    // Try to get user email from request body (for POST requests)
    let userEmail = 'findbenhere@gmail.com' // Default fallback
    try {
      const body = await request.json()
      if (body.email) {
        userEmail = body.email
      }
    } catch (e) {
      // Ignore JSON parsing errors for GET requests
    }
    
    console.log('🔍 Looking up user data for:', userEmail)
    
    // Try to fetch real user data
    const supabaseAdmin = createAdminClient()
    let testData = {
      userName: 'Test User',
      userEmail: userEmail,
      supplements: [],
      protocols: [],
      movement: [],
      mindfulness: []
    }
    
    try {
      // Find user by email in auth.users
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const user = users.users.find(u => u.email === userEmail)
      
      if (user) {
        console.log('👤 Found user:', user.id)
        
        // Find profile by user_id
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, display_name, user_id')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          console.log('📋 Found profile:', profile.id)
          testData.userName = profile.display_name || 'User'
          
          // Fetch real stack data
          const [supplements, allProtocols, movement, mindfulness] = await Promise.all([
            supabaseAdmin.from('supplements').select('name, dose, timing').eq('profile_id', profile.id),
            supabaseAdmin.from('protocols').select('name, frequency, schedule_days').eq('profile_id', profile.id),
            supabaseAdmin.from('movement').select('name, duration').eq('profile_id', profile.id),
            supabaseAdmin.from('mindfulness').select('name, duration').eq('profile_id', profile.id)
          ])
          
          // Filter protocols that are due today (0=Sunday, 1=Monday, etc.)
          const today = new Date().getDay()
          const protocols = allProtocols.data?.filter(protocol => {
            if (!protocol.schedule_days || protocol.schedule_days.length === 0) {
              return true // If no schedule specified, include it
            }
            return protocol.schedule_days.includes(today)
          }) || []
          
          testData.supplements = supplements.data || []
          testData.protocols = protocols
          testData.movement = movement.data || []
          testData.mindfulness = mindfulness.data || []
          
          console.log('📊 Real data found:', {
            supplements: testData.supplements.length,
            protocols: testData.protocols.length,
            movement: testData.movement.length,
            mindfulness: testData.mindfulness.length
          })
        } else {
          console.log('⚠️ No profile found for user')
        }
      } else {
        console.log('⚠️ No user found with email:', userEmail)
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error)
      // Fall back to placeholder data
      testData = {
        userName: 'Test User',
        userEmail: userEmail,
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
      message: `Test email sent to ${userEmail}`,
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