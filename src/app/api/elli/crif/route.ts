import { NextResponse } from 'next/server'

export async function GET() {
  // Disabled endpoint placeholder to unblock build; engine not bundled
  return NextResponse.json({ ok: false, error: 'elli_crif_disabled' }, { status: 501 })
}

