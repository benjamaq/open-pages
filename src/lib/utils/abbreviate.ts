export function abbreviateSupplementName(fullName: string): string {
  if (!fullName) return 'Supplement'
  const parts = fullName.split(',').map(p => p.trim())
  let brand = parts[0] || ''
  brand = brand
    .replace(/\s*(Nutrition|Naturals|Foods|Supplements|Labs|Research)$/i, '')
    .trim()
  let compound = ''
  const compounds = [
    'Magnesium', 'Calcium', 'Omega-3', 'Omega 3', 'Fish Oil', 'Vitamin D',
    'Vitamin D3', 'Vitamin C', 'Vitamin B12', 'B-Complex', 'B Complex',
    'Zinc', 'Iron', 'Probiotic', 'Probiotics', 'Prebiotic', 'Collagen',
    'Creatine', 'Ashwagandha', 'Melatonin', 'Turmeric', 'Curcumin',
    'CoQ10', 'L-Theanine', 'Theanine', 'GABA', 'Glycine', 'Laxative',
    'Digestive', 'Enzyme', 'Fiber', 'Protein', 'Whey', 'Rhodiola',
    'Elderberry', 'Echinacea', 'Multivitamin', 'Multi'
  ]
  const fullLower = fullName.toLowerCase()
  for (const c of compounds) {
    if (fullLower.includes(c.toLowerCase())) {
      compound = c
      break
    }
  }
  if (!compound && parts[1]) {
    compound = parts[1]
      .replace(/\d+\s*(mg|mcg|iu|g|oz|ml|count|capsules|tablets|softgels|gummies)/gi, '')
      .replace(/liquid|powder|gummies|capsules|tablets|softgels|caplets/gi, '')
      .trim()
      .split(' ')
      .slice(0, 2)
      .join(' ')
  }
  // Avoid duplication when compound already appears in brand/full name
  if (compound) {
    const brandLower = brand.toLowerCase()
    const compLower = compound.toLowerCase()
    if (brandLower.includes(compLower)) {
      compound = ''
    }
  }
  let abbreviated = `${brand} ${compound}`.trim()

  // Add differentiator for flavor/variant to avoid collisions
  const flavorList = ['Orange', 'Lemon', 'Natural Lemon', 'Berry', 'Strawberry', 'Vanilla', 'Chocolate', 'Tangerine', 'Citrus', 'Unflavored']
  for (const flavor of flavorList) {
    if (fullLower.includes(flavor.toLowerCase())) {
      const shortFlavor = flavor.split(' ').pop() as string
      abbreviated = `${abbreviated} (${shortFlavor})`
      break
    }
  }

  if (abbreviated.length > 35) {
    return abbreviated.slice(0, 32) + '...'
  }
  return abbreviated || fullName.split(',')[0] || 'Supplement'
}


