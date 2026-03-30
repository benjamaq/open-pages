import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { countCohortConfirmedParticipants, isCohortCapacityFull } from '@/lib/cohortRecruitment'
import StudyQualificationForm from './StudyQualificationForm'

type Props = { params: Promise<{ slug: string }> }

export default async function StudyApplyPage({ params }: Props) {
  const { slug: rawSlug } = await params
  const slug = String(rawSlug || '')
    .trim()
    .toLowerCase()
  if (!slug) notFound()

  const { data: cohort, error } = await supabaseAdmin
    .from('cohorts')
    .select('id, slug, brand_name, product_name, max_participants')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !cohort) notFound()

  const maxP = (cohort as { max_participants?: number | null }).max_participants ?? null
  const cohortId = String((cohort as { id: string }).id)

  const confirmed = await countCohortConfirmedParticipants(cohortId)
  if (isCohortCapacityFull(maxP, confirmed)) {
    redirect(`/study/${encodeURIComponent(slug)}?status=full`)
  }

  return (
    <StudyQualificationForm
      cohortSlug={slug}
      brandName={String((cohort as { brand_name: string }).brand_name)}
      productName={String((cohort as { product_name: string }).product_name)}
    />
  )
}
