import { NextResponse } from 'next/server'

export async function GET() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  
  return NextResponse.json({
    measurementId,
    isSet: !!measurementId,
    expected: 'G-BQJWCVNJH0',
    matches: measurementId === 'G-BQJWCVNJH0'
  })
}
