import { NextRequest, NextResponse } from 'next/server'

// Day-2 nurture email disabled per new cadence
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: false, error: 'Day-2 nurture disabled' }, { status: 410 })
}


