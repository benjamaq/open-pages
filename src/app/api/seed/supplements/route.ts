import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { seedMagnesiumTestData } from '@/app/actions/seedSupplementsTest'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await seedMagnesiumTestData()
  if ('ok' in result && result.ok) {
    return NextResponse.json({ success: true, created: result.created })
  }
  return NextResponse.json({ error: (result as any).error || 'Seed failed' }, { status: 500 })
}














