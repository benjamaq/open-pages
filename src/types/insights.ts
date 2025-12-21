export type GoalCategory =
  | 'sleep'
  | 'energy'
  | 'gut'
  | 'cognitive'
  | 'immunity'
  | 'longevity'
  | 'hormonal'
  | 'mood'
  | 'other'

export type IngredientType =
  | 'amino_acid'
  | 'mineral'
  | 'vitamin'
  | 'botanical'
  | 'lipid'
  | 'peptide'
  | 'blend'
  | 'other'

export interface InsightsSummary {
  monthlySpend: number
  yearlySpend: number
  currency: string

  activeSuppCount: number
  testedSuppCount: number

  categorySpend: Array<{
    category: GoalCategory
    monthlySpend: number
    percentage: number
  }>

  ingredientComposition: Array<{
    ingredientType: IngredientType
    percentage: number
  }>

  topCostDrivers: Array<{
    userSupplementId: string
    name: string
    brandName?: string | null
    monthlySpend: number
    primaryCategory: GoalCategory
  }>

  inferredGoals: Array<{
    category: GoalCategory
    percentage: number
  }>

  monthlyTrend: Array<{
    month: string // YYYY-MM
    monthlySpend: number
  }>

  nextBestInsight: {
    userSupplementId: string | null
    name: string | null
    primaryCategory: GoalCategory | null
    monthlySpend: number | null
    reason: string | null
  } | null
}





