/**
 * Resolves public /study/[slug] "You'll receive" incentives from `cohorts.study_landing_reward_config`.
 * Defaults preserve the historical DoNotAge-style product-supply completion reward when config is absent.
 */

import { isCognitiveShapedCheckinFields, normalizeCohortCheckinFields } from '@/lib/cohortCheckinFields'

export type CompletionPartnerRewardType = 'product_supply' | 'store_credit'

export type StudyLandingRewardConfigJson = {
  completion_partner_reward_type?: CompletionPartnerRewardType
  partner_store_credit?: {
    title?: string
    description?: string
    visual_path?: string
  }
  /** Two lines under "You'll receive" heading */
  summary_lines?: string[]
  package_value?: {
    headline?: string
    subline?: string
  }
}

export type StudyLandingRewardsResolved = {
  completionType: CompletionPartnerRewardType
  summaryLines: [string, string]
  packageValueHeadline: string
  packageValueSubline: string
  /** Card 1 — study product for daily use */
  studyProductCard: {
    title: string
    body: string
    footer: string
  }
  /** Card 2 — partner completion incentive */
  completionCard:
    | {
        kind: 'product_supply'
        title: string
        body: string
        footer: string
      }
    | {
        kind: 'store_credit'
        title: string
        body: string
        footer: string
        imagePath: string
      }
}

function recordField(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

function str(v: unknown): string {
  return String(v ?? '').trim()
}

export function parseStudyLandingRewardConfig(raw: unknown): StudyLandingRewardConfigJson | null {
  const o = recordField(raw)
  if (!o) return null
  const completion_partner_reward_type =
    o.completion_partner_reward_type === 'store_credit' || o.completion_partner_reward_type === 'product_supply'
      ? o.completion_partner_reward_type
      : undefined
  const psc = recordField(o.partner_store_credit)
  const package_value = recordField(o.package_value)
  let summary_lines: string[] | undefined
  if (Array.isArray(o.summary_lines)) {
    summary_lines = o.summary_lines.map((x) => String(x ?? '').trim()).filter(Boolean)
  }
  return {
    completion_partner_reward_type,
    partner_store_credit: psc
      ? {
          title: str(psc.title) || undefined,
          description: str(psc.description) || undefined,
          visual_path: str(psc.visual_path) || undefined,
        }
      : undefined,
    summary_lines,
    package_value: package_value
      ? {
          headline: str(package_value.headline) || undefined,
          subline: str(package_value.subline) || undefined,
        }
      : undefined,
  }
}

export function resolveStudyLandingRewards(params: {
  cohortRow: Record<string, unknown>
  brandDisplay: string
  productName: string
  studyDays: number
  /** Fallback when `partner_store_credit.visual_path` omitted — must be hero art, never product.png */
  defaultStoreCreditVisualPath: string
  /**
   * From `checkin_fields` (same as study page). When true and DB does not explicitly set
   * `product_supply`, completion defaults to store credit + hero image — not DoNotAge-style product duplicate.
   */
  isCognitiveShapedCohort: boolean
}): StudyLandingRewardsResolved {
  const { cohortRow, brandDisplay, productName, studyDays, defaultStoreCreditVisualPath, isCognitiveShapedCohort } =
    params
  const pn = String(productName || 'Study product').trim() || 'Study product'
  const bd = String(brandDisplay || 'Study partner').trim() || 'Study partner'
  const cfg = parseStudyLandingRewardConfig(cohortRow.study_landing_reward_config)

  const explicit = cfg?.completion_partner_reward_type
  let completionType: CompletionPartnerRewardType
  if (explicit === 'store_credit') {
    completionType = 'store_credit'
  } else if (explicit === 'product_supply') {
    completionType = 'product_supply'
  } else if (isCognitiveShapedCohort) {
    completionType = 'store_credit'
  } else {
    completionType = 'product_supply'
  }

  const defaultProductSupplySummary: [string, string] = [`3-month supply of ${pn}`, '3 months of BioStackr Pro']
  const defaultStoreCreditSummary: [string, string] = ['$120 store credit', '3 months of BioStackr Pro']

  let summaryLines: [string, string]
  if (completionType === 'store_credit') {
    if (cfg?.summary_lines && cfg.summary_lines.length >= 2) {
      summaryLines = [cfg.summary_lines[0], cfg.summary_lines[1]]
    } else if (cfg?.summary_lines && cfg.summary_lines.length === 1) {
      summaryLines = [cfg.summary_lines[0], '3 months of BioStackr Pro']
    } else {
      summaryLines = defaultStoreCreditSummary
    }
  } else if (cfg?.summary_lines && cfg.summary_lines.length >= 2) {
    summaryLines = [cfg.summary_lines[0], cfg.summary_lines[1]]
  } else if (cfg?.summary_lines && cfg.summary_lines.length === 1) {
    summaryLines = [cfg.summary_lines[0], defaultProductSupplySummary[1]]
  } else {
    summaryLines = defaultProductSupplySummary
  }

  const defaultPkgHeadline = '€200+'
  const defaultPkgSub = `Combined participant reward value when you complete all ${studyDays} days.`
  const packageValueHeadline = str(cfg?.package_value?.headline) || defaultPkgHeadline
  const packageValueSubline = str(cfg?.package_value?.subline) || defaultPkgSub

  const studyProductCard = {
    title: `${pn} for your ${studyDays}-day study`,
    body: 'Supplied so you can run every day of the study.',
    footer: 'Study product',
  }

  if (completionType === 'store_credit') {
    const t = str(cfg?.partner_store_credit?.title) || '$120 store credit'
    const d =
      str(cfg?.partner_store_credit?.description) ||
      `Receive $120 in store credit from ${bd} when you complete the full study.`
    const imagePath = str(cfg?.partner_store_credit?.visual_path) || defaultStoreCreditVisualPath
    return {
      completionType: 'store_credit',
      summaryLines,
      packageValueHeadline,
      packageValueSubline,
      studyProductCard,
      completionCard: {
        kind: 'store_credit',
        title: t,
        body: d,
        footer: 'Completion reward',
        imagePath,
      },
    }
  }

  return {
    completionType: 'product_supply',
    summaryLines,
    packageValueHeadline,
    packageValueSubline,
    studyProductCard,
    completionCard: {
      kind: 'product_supply',
      title: `3-month supply of ${pn}`,
      body: `Yours when you finish all ${studyDays} daily check-ins.`,
      footer: 'Completion reward',
    },
  }
}

/**
 * Store-credit vs product-supply partner completion reward (transactional email copy).
 * Mirrors `resolveStudyLandingRewards` when `cohortRow` has no full product/brand context.
 */
export function cohortUsesStoreCreditPartnerReward(cohortRow: {
  study_landing_reward_config?: unknown
  checkin_fields?: unknown
}): boolean {
  const cfg = parseStudyLandingRewardConfig(cohortRow.study_landing_reward_config)
  const explicit = cfg?.completion_partner_reward_type
  if (explicit === 'store_credit') return true
  if (explicit === 'product_supply') return false
  const normalized = normalizeCohortCheckinFields(cohortRow.checkin_fields)
  if (isCognitiveShapedCheckinFields(normalized)) return true
  return false
}

export function storeCreditTitleFromCohortRow(cohortRow: { study_landing_reward_config?: unknown }): string {
  const cfg = parseStudyLandingRewardConfig(cohortRow.study_landing_reward_config)
  const t = cfg?.partner_store_credit?.title
  const s = String(t ?? '').trim()
  return s || '$120 store credit'
}
