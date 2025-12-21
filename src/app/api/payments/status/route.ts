import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ has_report: false, is_member: false })

  // Dev override via cookies for quick testing
  const ck = await cookies()
  const devReport = ck.get('biostackr_has_report')?.value
  const devMember = ck.get('biostackr_member')?.value
  if (devReport || devMember) {
    return NextResponse.json({
      has_report: devReport === '1',
      is_member: devMember === '1'
    })
  }

  // Default: free state until webhooks update a real column
  return NextResponse.json({ has_report: false, is_member: false })
}



