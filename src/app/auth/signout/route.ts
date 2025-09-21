import { createClient } from '../../../lib/supabase/server'
import { NextResponse } from 'next/server'

async function handleSignOut() {
  const supabase = await createClient()

  // Check if we have a session to remove
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3013'), {
    status: 302,
  })
}

export async function POST() {
  return handleSignOut()
}

export async function GET() {
  return handleSignOut()
}
