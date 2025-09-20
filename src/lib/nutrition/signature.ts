// Nutrition Signature Types and Helpers

export type NutritionSignature = {
  style?: { key: 'keto'|'carnivore'|'mediterranean'|'plant_based'|'high_protein'|'paleo'|'custom'; label: string }
  fasting?: { window: '12:12'|'14:10'|'16:8'|'18:6'|'OMAD'; days_per_week?: number }
  protein_target_g?: number
  rule?: { key: 'no_seed_oils'|'no_late_meals'|'alcohol_free'|'custom'; label: string }
  goto_meal?: string       // ≤24 chars
  weakness?: string        // ≤24 chars
  plant_goal?: { per_day?: number; per_week?: number }
  experiment?: string      // ≤24 chars
  header_badges?: Array<'style'|'fasting'|'protein'|'rule'|'goto'|'weakness'|'plants'|'experiment'> // priority order
  enabled?: boolean        // treat as enabled if header_badges has length>0
}

export type BadgeKey = 'style'|'fasting'|'protein'|'rule'|'goto'|'weakness'|'plants'|'experiment'

// Badge accent colors for visual distinction
export const BADGE_ACCENTS: Record<BadgeKey, string> = {
  style: 'emerald',      // 🥑 Diet style
  fasting: 'blue',       // ⏳ Fasting
  protein: 'orange',     // 💪 Protein
  rule: 'red',          // 🚫 Rules/avoids
  goto: 'purple',       // 🥗 Go-to meal
  weakness: 'pink',     // 🍫 Weakness
  plants: 'green',      // 🥦 Plant goal
  experiment: 'yellow'  // 🧪 Experiment
}

// Predefined options for dropdowns
export const DIET_STYLES = [
  { key: 'keto', label: 'Keto', icon: '🥑' },
  { key: 'carnivore', label: 'Carnivore', icon: '🥩' },
  { key: 'mediterranean', label: 'Mediterranean', icon: '🐟' },
  { key: 'plant_based', label: 'Plant-based', icon: '🌿' },
  { key: 'high_protein', label: 'High-protein', icon: '💪' },
  { key: 'paleo', label: 'Paleo', icon: '🦴' },
  { key: 'custom', label: 'Custom', icon: '🍽️' }
] as const

export const FASTING_WINDOWS = [
  { key: '12:12', label: '12:12', description: '12 hours eating, 12 hours fasting' },
  { key: '14:10', label: '14:10', description: '10 hours eating, 14 hours fasting' },
  { key: '16:8', label: '16:8', description: '8 hours eating, 16 hours fasting' },
  { key: '18:6', label: '18:6', description: '6 hours eating, 18 hours fasting' },
  { key: 'OMAD', label: 'OMAD', description: 'One meal a day' }
] as const

export const COMMON_RULES = [
  { key: 'no_seed_oils', label: 'No seed oils', icon: '🚫' },
  { key: 'no_late_meals', label: 'No late meals', icon: '🚫' },
  { key: 'alcohol_free', label: 'Alcohol-free', icon: '🚫' },
  { key: 'custom', label: 'Custom rule', icon: '🚫' }
] as const

// Helper functions
export function formatBadgeLabel(key: BadgeKey, signature: NutritionSignature): string | null {
  switch (key) {
    case 'style':
      return signature.style?.label || null
    
    case 'fasting':
      if (!signature.fasting) return null
      const base = signature.fasting.window
      const days = signature.fasting.days_per_week
      return days && days < 7 ? `${base} • ${days}d/wk` : base
    
    case 'protein':
      return signature.protein_target_g ? `${signature.protein_target_g}g/day` : null
    
    case 'rule':
      return signature.rule?.label || null
    
    case 'goto':
      return signature.goto_meal || null
    
    case 'weakness':
      return signature.weakness || null
    
    case 'plants':
      if (!signature.plant_goal) return null
      if (signature.plant_goal.per_day) return `${signature.plant_goal.per_day} plants/day`
      if (signature.plant_goal.per_week) return `${signature.plant_goal.per_week} plants/wk`
      return null
    
    case 'experiment':
      return signature.experiment || null
    
    default:
      return null
  }
}

export function getBadgeIcon(key: BadgeKey): string {
  const icons: Record<BadgeKey, string> = {
    style: '🥑',
    fasting: '⏳',
    protein: '💪',
    rule: '🚫',
    goto: '🥗',
    weakness: '🍫',
    plants: '🥦',
    experiment: '🧪'
  }
  return icons[key]
}

export function getBadgeAccentClass(accent: string): string {
  const classes: Record<string, string> = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    pink: 'border-pink-200 bg-pink-50 text-pink-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700'
  }
  return classes[accent] || 'border-gray-200 bg-gray-50 text-gray-700'
}

export function validateNutritionSignature(signature: Partial<NutritionSignature>): NutritionSignature {
  const validated: NutritionSignature = {}

  // Validate style
  if (signature.style?.key && signature.style?.label) {
    validated.style = {
      key: signature.style.key,
      label: signature.style.label.trim().slice(0, 20)
    }
  }

  // Validate fasting
  if (signature.fasting?.window) {
    validated.fasting = {
      window: signature.fasting.window,
      days_per_week: signature.fasting.days_per_week && signature.fasting.days_per_week >= 1 && signature.fasting.days_per_week <= 7 
        ? signature.fasting.days_per_week 
        : undefined
    }
  }

  // Validate protein target
  if (signature.protein_target_g && signature.protein_target_g > 0 && signature.protein_target_g <= 500) {
    validated.protein_target_g = Math.round(signature.protein_target_g)
  }

  // Validate rule
  if (signature.rule?.key && signature.rule?.label) {
    validated.rule = {
      key: signature.rule.key,
      label: signature.rule.label.trim().slice(0, 20)
    }
  }

  // Validate text fields (24 char limit)
  if (signature.goto_meal?.trim()) {
    validated.goto_meal = signature.goto_meal.trim().slice(0, 24)
  }

  if (signature.weakness?.trim()) {
    validated.weakness = signature.weakness.trim().slice(0, 24)
  }

  if (signature.experiment?.trim()) {
    validated.experiment = signature.experiment.trim().slice(0, 24)
  }

  // Validate plant goal
  if (signature.plant_goal) {
    const goal: { per_day?: number; per_week?: number } = {}
    if (signature.plant_goal.per_day && signature.plant_goal.per_day > 0 && signature.plant_goal.per_day <= 50) {
      goal.per_day = Math.round(signature.plant_goal.per_day)
    }
    if (signature.plant_goal.per_week && signature.plant_goal.per_week > 0 && signature.plant_goal.per_week <= 200) {
      goal.per_week = Math.round(signature.plant_goal.per_week)
    }
    if (goal.per_day || goal.per_week) {
      validated.plant_goal = goal
    }
  }

  // Validate header badges order
  if (signature.header_badges && Array.isArray(signature.header_badges)) {
    const validKeys: BadgeKey[] = ['style', 'fasting', 'protein', 'rule', 'goto', 'weakness', 'plants', 'experiment']
    validated.header_badges = signature.header_badges.filter(key => validKeys.includes(key))
  }

  // Set enabled based on header_badges length
  validated.enabled = (validated.header_badges?.length || 0) > 0

  return validated
}

export function getDefaultNutritionSignature(): NutritionSignature {
  return {
    header_badges: [],
    enabled: false
  }
}
