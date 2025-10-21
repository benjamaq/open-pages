import { NextResponse } from 'next/server'
import { getUserSubscription, getUserUsage } from '@/lib/actions/subscriptions'

export async function GET() {
  try {
    const [subscription, usage] = await Promise.all([
      getUserSubscription(),
      getUserUsage(),
    ])
    return NextResponse.json({ subscription, usage })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load subscription summary' }, { status: 500 })
  }
}


