import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, ctx: any) {
  let id: string | null = null
  try {
    const p = ctx?.params
    if (p && typeof p.then === 'function') {
      const resolved = await p
      id = String(resolved?.id || '')
    } else {
      id = String(p?.id || '')
    }
  } catch {}
  console.log('[testing API] HIT:', id, req.method, req.url)
  return NextResponse.json({ received: id, ok: true })
}
