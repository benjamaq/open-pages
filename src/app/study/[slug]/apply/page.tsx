import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  countCohortPipelineParticipants,
  isCohortCapacityFull,
  isRecruitmentPastDeadline,
} from '@/lib/cohortRecruitment'
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
    .select('id, slug, brand_name, product_name, recruitment_closes_at, max_participants')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !cohort) notFound()

  const closesAt = (cohort as { recruitment_closes_at?: string | null }).recruitment_closes_at ?? null
  const maxP = (cohort as { max_participants?: number | null }).max_participants ?? null
  const cohortId = String((cohort as { id: string }).id)

  if (isRecruitmentPastDeadline(closesAt)) {
    redirect(`/study/${encodeURIComponent(slug)}?status=closed`)
  }

  const pipeline = await countCohortPipelineParticipants(cohortId)
  if (isCohortCapacityFull(maxP, pipeline)) {
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
