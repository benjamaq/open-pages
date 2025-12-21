'use server'

import { NextRequest, NextResponse } from 'next/server'
import { computeSignalForSupplement } from '@/lib/engine'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await computeSignalForSupplement(params.id, '30d')
    return NextResponse.json(res)
  } catch (e: any) {
    console.error('signals GET error', e)
    return NextResponse.json({ error: 'failed_to_compute' }, { status: 500 })
  }
}


