import { NextRequest, NextResponse } from 'next/server'
import { sendDay2TipsEmail } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const userEmail = email.trim()
    const userName = (name || '').trim() || 'there'

    const result = await sendDay2TipsEmail({ userEmail, userName })
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Unknown error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: result.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to send test email' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const name = searchParams.get('name') || undefined
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  try {
    const result = await sendDay2TipsEmail({ userEmail: email, userName: name || 'there' })
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    return NextResponse.json({ success: true, id: result.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to send test email' }, { status: 500 })
  }
}


