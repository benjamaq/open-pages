import { NextRequest, NextResponse } from 'next/server'
import {
  COHORT_EMAIL_PREVIEW_TEMPLATE_IDS,
  type CohortEmailPreviewTemplateId,
  renderCohortEmailPreviewHtml,
} from '@/lib/cohortEmailPreviewRender'

export const dynamic = 'force-dynamic'

function previewSecret(): string {
  return String(process.env.COHORT_EMAIL_PREVIEW_SECRET || '').trim()
}

function assertPreviewAuth(request: NextRequest): NextResponse | null {
  const secret = previewSecret()
  if (!secret) {
    return NextResponse.json({ error: 'Previews disabled (set COHORT_EMAIL_PREVIEW_SECRET)' }, { status: 404 })
  }
  const q = request.nextUrl.searchParams.get('secret')
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (q === secret || bearer === secret) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Dev/staging HTML preview for cohort transactional emails.
 *
 * `GET /api/dev/cohort-email-preview?secret=$COHORT_EMAIL_PREVIEW_SECRET&template=enrollment&partnerBrandName=DoNotAge&productName=SureSleep`
 *
 * Optional: `firstName`, `studyDurationDays`, `resultReadyRewardVariant` (`claim`|`default`|`claimed`).
 * Response: `text/html` with full email document.
 */
export async function GET(request: NextRequest) {
  const denied = assertPreviewAuth(request)
  if (denied) return denied

  const sp = request.nextUrl.searchParams
  const template = String(sp.get('template') || '').trim() as CohortEmailPreviewTemplateId
  if (!COHORT_EMAIL_PREVIEW_TEMPLATE_IDS.includes(template)) {
    return NextResponse.json(
      {
        error: 'Invalid template',
        templates: [...COHORT_EMAIL_PREVIEW_TEMPLATE_IDS],
      },
      { status: 400 },
    )
  }

  const partnerBrandName = String(sp.get('partnerBrandName') || sp.get('brand') || 'Study partner').trim() || 'Study partner'
  const productName = String(sp.get('productName') || sp.get('product') || 'product').trim() || 'product'
  const firstName = sp.get('firstName') || undefined
  const studyDurationDaysRaw = sp.get('studyDurationDays')
  const studyDurationDays =
    studyDurationDaysRaw != null && studyDurationDaysRaw !== ''
      ? Number(studyDurationDaysRaw)
      : undefined
  const resultReadyRewardVariant = sp.get('resultReadyRewardVariant') as
    | 'claim'
    | 'default'
    | 'claimed'
    | undefined

  const { html } = renderCohortEmailPreviewHtml(template, {
    partnerBrandName,
    productName,
    firstName,
    studyDurationDays:
      typeof studyDurationDays === 'number' && Number.isFinite(studyDurationDays)
        ? studyDurationDays
        : undefined,
    resultReadyRewardVariant:
      resultReadyRewardVariant === 'claim' ||
      resultReadyRewardVariant === 'default' ||
      resultReadyRewardVariant === 'claimed'
        ? resultReadyRewardVariant
        : undefined,
  })

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'private, no-store',
    },
  })
}
