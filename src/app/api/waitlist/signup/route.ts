import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

// POST /api/waitlist/signup - Add email to waitlist
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabase = await createClient()

    // Insert email into waitlist
    const { data, error } = await supabase
      .from('waitlist_signups')
      .insert([
        {
          email: email.toLowerCase().trim(),
          source: 'website'
        }
      ])
      .select()

    if (error) {
      if (error.code === '23505') {
        // Duplicate email
        return NextResponse.json({ 
          error: 'Email already on waitlist',
          alreadyExists: true 
        }, { status: 409 })
      }
      
      console.error('Waitlist signup error:', error)
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully joined waitlist!',
      data: data[0]
    })

  } catch (error) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
