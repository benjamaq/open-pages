import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const safe = query.replace(/[^a-z0-9\s\-]/gi, ' ').trim()
    const tokens = safe.split(/\s+/).filter(Boolean)

    const supabase = await createClient()
    let qb = supabase
      .from('product')
      .select(`
        *,
        canonical_supplement:canonical_supplement_id (
          generic_name,
          ingredient_type,
          default_goal_tags
        )
      `)
      .order('brand_name')

    // Require every token to match either brand or product (AND across tokens, OR within each token)
    for (const t of tokens.length > 0 ? tokens : [safe]) {
      qb = qb.or(`product_name.ilike.*${t}*,brand_name.ilike.*${t}*`)
    }
    qb = qb.limit(25)

    const { data: products, error } = await qb

    let results = (products || []).map((p: any) => {
      const monthlyEstimate = calculateMonthlyCost(
        Number(p.price_per_container),
        Number(p.servings_per_container),
        Number(p.dose_per_serving_amount),
        2, // default daily dose
        7  // days per week
      )
      return {
        id: p.id,
        brandName: p.brand_name,
        productName: p.product_name,
        servings: p.servings_per_container,
        dosePerServing: p.dose_per_serving_amount,
        doseUnit: p.dose_per_serving_unit,
        price: p.price_per_container,
        currency: p.currency,
        imageUrl: p.image_url,
        productUrl: p.product_url,
        canonicalName: p.canonical_supplement?.generic_name,
        suggestedGoals: p.canonical_supplement?.default_goal_tags || [],
        monthlyEstimate
      }
    })

    // Fallback stub catalog if DB empty or errored
    if ((error || !products || products.length === 0)) {
      const STUB = [
        {
          id: 'prod_mag_threonate',
          productName: 'Magnesium L-Threonate 2000mg',
          brandName: 'NeuroMag',
          canonicalName: 'Magnesium',
          suggestedGoals: ['sleep', 'mood'],
          servings: 30,
          dosePerServing: 2,
          doseUnit: 'caps',
          price: 39,
          currency: 'USD',
          imageUrl: null,
          productUrl: null,
          monthlyEstimate: calculateMonthlyCost(39, 30, 2, 2, 7)
        },
        {
          id: 'prod_creatine_monohydrate',
          productName: 'Creatine Monohydrate 5g',
          brandName: 'OptiStrength',
          canonicalName: 'Creatine',
          suggestedGoals: ['cognitive', 'energy'],
          servings: 60,
          dosePerServing: 1,
          doseUnit: 'scoop',
          price: 24,
          currency: 'USD',
          imageUrl: null,
          productUrl: null,
          monthlyEstimate: calculateMonthlyCost(24, 60, 1, 1, 7)
        },
        {
          id: 'prod_vitamin_d3_k2',
          productName: 'Vitamin D3 + K2',
          brandName: 'SunLabs',
          canonicalName: 'Vitamin D',
          suggestedGoals: ['immunity', 'longevity'],
          servings: 60,
          dosePerServing: 1,
          doseUnit: 'softgel',
          price: 18,
          currency: 'USD',
          imageUrl: null,
          productUrl: null,
          monthlyEstimate: calculateMonthlyCost(18, 60, 1, 1, 7)
        }
      ]
      const ql = safe.toLowerCase()
      results = STUB.filter(p =>
        p.productName.toLowerCase().includes(ql) || (p.brandName || '').toLowerCase().includes(ql)
      )
    }

    return NextResponse.json(results)
  } catch (e: any) {
    // Fail-soft: return empty list for compatibility with UI
    return NextResponse.json([])
  }
}

function calculateMonthlyCost(
  pricePerContainer: number,
  servingsPerContainer: number,
  dosePerServing: number,
  dailyDose: number,
  daysPerWeek: number
) {
  if (!pricePerContainer || !servingsPerContainer || !dosePerServing) {
    return { defaultDose: dailyDose, daysPerWeek, cost: 0 }
  }
  const dailyCost = (pricePerContainer / servingsPerContainer) * (dailyDose / dosePerServing)
  const monthlyCost = dailyCost * (daysPerWeek / 7) * 30
  return {
    defaultDose: dailyDose,
    daysPerWeek,
    cost: Math.round(monthlyCost * 100) / 100
  }
}


