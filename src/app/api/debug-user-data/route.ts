import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../utils/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient()
    
    // Get all users
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    console.log('👥 All users:', users.users.map(u => ({ id: u.id, email: u.email })))
    
    // Find your specific user
    const userEmails = ['findbenhere@gmail.com', 'ben09@me.com', 'ben09@icloud.com']
    const userData = []
    
    for (const email of userEmails) {
      const user = users.users.find(u => u.email === email)
      if (user) {
        console.log(`🔍 Found user ${email}:`, user.id)
        
        // Get profile
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, display_name, user_id')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          console.log(`📋 Profile for ${email}:`, profile)
          
          // Get all stack data
          const [supplements, protocols, movement, mindfulness] = await Promise.all([
            supabaseAdmin.from('supplements').select('*').eq('profile_id', profile.id),
            supabaseAdmin.from('protocols').select('*').eq('profile_id', profile.id),
            supabaseAdmin.from('movement').select('*').eq('profile_id', profile.id),
            supabaseAdmin.from('mindfulness').select('*').eq('profile_id', profile.id)
          ])
          
          userData.push({
            email,
            userId: user.id,
            profile: profile,
            supplements: supplements.data || [],
            protocols: protocols.data || [],
            movement: movement.data || [],
            mindfulness: mindfulness.data || []
          })
          
          console.log(`📊 Data for ${email}:`, {
            supplements: supplements.data?.length || 0,
            protocols: protocols.data?.length || 0,
            movement: movement.data?.length || 0,
            mindfulness: mindfulness.data?.length || 0
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      userCount: users.users.length,
      userData: userData
    })
    
  } catch (error: any) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}
