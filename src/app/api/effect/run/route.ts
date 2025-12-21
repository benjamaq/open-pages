import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { POST as runEffect } from '@/app/api/cron/effectengine/route'

export const dynamic = 'force-dynamic'

export async function POST() {
  // Reuse the cron handler for a manual run
  return runEffect()
}


