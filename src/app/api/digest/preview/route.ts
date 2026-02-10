import { NextResponse } from 'next/server'
import { generateDailyDigestHTML, type DigestChange, coalesceChanges } from '@/lib/email/digest-templates'

export async function GET() {
  const now = new Date()
  const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const mockChanges: DigestChange[] = [
    {
      id: 'chg-1',
      item_type: 'supplement',
      change_type: 'added',
      fields: { name: 'Magnesium Glycinate 200mg', details: 'Evening routine for sleep quality' },
      changed_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'chg-2',
      item_type: 'protocol',
      change_type: 'updated',
      fields: { name: 'Sauna Protocol', frequency: { from: '2x/week', to: '3x/week' } },
      changed_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'chg-3',
      item_type: 'movement',
      change_type: 'added',
      fields: { name: 'Lumaflex Red Light', details: 'For shoulder pain relief' },
      changed_at: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()
    }
  ]

  const html = generateDailyDigestHTML({
    ownerName: 'Emma',
    ownerSlug: 'emma-chronic-pain',
    followerEmail: 'you@example.com',
    cadence: 'daily',
    changes: coalesceChanges(mockChanges),
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


