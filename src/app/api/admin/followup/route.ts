import { NextRequest, NextResponse } from 'next/server'

// Follow-up blast disabled per new email policy
export async function GET(_req: NextRequest) {
  return NextResponse.json({ ok: false, error: 'Follow-up blast disabled' }, { status: 410 })
}

export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: false, error: 'Follow-up blast disabled' }, { status: 410 })
}


