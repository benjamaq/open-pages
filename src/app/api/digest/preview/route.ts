import { NextResponse } from 'next/server'
import { generateDailyDigestHTML, type DigestChange } from '@/lib/email/digest-templates'

export async function GET() {
  const now = new Date()
  const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const mockChanges: DigestChange[] = [
    {
      type: 'supplement_added',
      item_type: 'supplements',
      name: 'Magnesium Glycinate 200mg',
      details: 'Evening routine for sleep quality',
      changed_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      type: 'protocol_updated',
      item_type: 'protocols',
      name: 'Sauna Protocol',
      details: 'Increased to 3x/week',
      changed_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      type: 'gear_added',
      item_type: 'gear',
      name: 'Lumaflex Red Light',
      details: 'For shoulder pain relief',
      changed_at: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()
    }
  ]

  const html = generateDailyDigestHTML({
    ownerName: 'Emma',
    ownerSlug: 'emma-chronic-pain',
    followerEmail: 'you@example.com',
    cadence: 'daily',
    changes: mockChanges,
    profileUrl: 'https://biostackr.io/u/emma-chronic-pain',
    manageUrl: 'https://biostackr.io/manage-follow?id=example',
    unsubscribeUrl: 'https://biostackr.io/unsubscribe?token=example',
    periodStart: periodStart.toISOString(),
    periodEnd: now.toISOString()
  })

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  })
}


