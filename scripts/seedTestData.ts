import { createClient } from '@supabase/supabase-js'

// Run with: npx tsx scripts/seedTestData.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key required

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestData() {
  // Fixed user for this seed run per brief
  const userId = '5bc552cd-615a-46c0-bb82-342e9659d730'

  console.log('🌱 Starting test data seed...')

  console.log('🗑️  Cleaning existing data...')
  await supabase.from('daily_entries').delete().eq('user_id', userId)
  await supabase.from('elli_messages').delete().eq('user_id', userId)

  const entries: any[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const localDate = date.toISOString().split('T')[0]

    // dayIdx: 0 oldest .. 29 today (exact mapping for brief)
    const dayIdx = 29 - i

    const hasAlcohol     = [10,11,12,25].includes(dayIdx)
    const hasHighStress  = [20,21,22,26].includes(dayIdx)
    const hasHighCarb    = [11,18,24].includes(dayIdx)
    const hasExercise    = dayIdx % 3 === 0
    const hasIceBath     = [5,10,15,20,25].includes(dayIdx)
    const skipsMagnesium = [8,15,16,27].includes(dayIdx)

    // Baseline
    let pain  = 5
    let sleep = 7
    let mood  = 7

    // Apply pattern rules (explicit days override baseline)
    if (hasAlcohol)     pain = Math.max(pain, 8)
    if (hasHighStress)  pain = Math.max(pain, 7)
    if (hasHighCarb)    pain = Math.max(pain, 7)
    if (hasExercise)    pain = Math.min(pain, 4)
    if (hasIceBath)     pain = Math.min(pain, 4)
    if (skipsMagnesium) pain = Math.max(pain, 7)

    // Variation ±1
    const jitter = () => (Math.random() < 0.5 ? -1 : 1)
    if (Math.random() < 0.5) pain  = Math.max(1, Math.min(10, pain  + jitter()))
    if (Math.random() < 0.5) sleep = Math.max(1, Math.min(10, sleep + jitter()))
    if (Math.random() < 0.5) mood  = Math.max(1, Math.min(10, mood  + jitter()))

    const lifestyle_factors: string[] = []
    if (hasAlcohol)    lifestyle_factors.push('alcohol')
    if (hasHighStress) lifestyle_factors.push('high_stress')
    if (hasHighCarb)   lifestyle_factors.push('high_carb_meal')

    const symptoms: string[] = []
    if (pain >= 7) symptoms.push('headache')
    if (pain >= 8) symptoms.push('fatigue')

    const exercise_type = hasExercise ? 'walking' : null
    const exercise_intensity = hasExercise ? 'moderate' : null
    const protocols = hasIceBath ? ['ice_bath'] : []
    const skipped_supplements = skipsMagnesium ? ['magnesium'] : []

    entries.push({
      user_id: userId,
      local_date: localDate,
      pain: Math.round(pain),
      sleep_quality: Math.round(sleep),
      mood: Math.round(mood),
      lifestyle_factors: lifestyle_factors.length ? lifestyle_factors : null,
      symptoms: symptoms.length ? symptoms : null,
      exercise_type,
      exercise_intensity,
      protocols: protocols.length ? protocols : null,
      skipped_supplements: skipped_supplements.length ? skipped_supplements : null
    })
  }

  console.log(`📊 Generated ${entries.length} days of data`)
  console.log('💾 Inserting entries...')
  const { error } = await supabase.from('daily_entries').insert(entries as any)
  if (error) {
    console.error('❌ Error inserting entries:', error)
    process.exit(1)
  }

  console.log('✅ Test data seeded successfully!')
  console.log('\n📈 Expected patterns:')
  console.log('- 🍷 Alcohol increases pain (+3 points, 4 occurrences)')
  console.log('- 😰 High stress increases pain (+2 points, 4 occurrences)')
  console.log('- 💤 Good sleep reduces pain (-2 points, 7 occurrences)')
  console.log('- 💊 Skipping Magnesium increases pain (+2 points, 4 occurrences)')
  console.log('- 🚶 Walking reduces pain (-1 point, ~10 occurrences)')
  console.log('- 🍝 High-carb meals increase pain (+2 points, 3 occurrences)')
  console.log('- 🤕 Headaches appear on high pain days')
  console.log('\n🔄 Do a check-in to trigger insights computation and then review the dashboard and /patterns page.')
}

seedTestData()


