import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    if (q.length < 2) return NextResponse.json([])

    console.log('[catalog/search] query:', q)
    console.log('[catalog/search] service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    const results: any[] = []
    const seen = new Set<string>()
    const keyOf = (name: any, brand: any) => `${String(name || '').trim().toLowerCase()}|${String(brand || '').trim().toLowerCase()}`

    // 1) iHerb products first (largest dataset)
    try {
      const { data: ih, error: ihErr } = await supabaseAdmin
        .from('iherb_products')
        .select('id, title, brand, url, price, price_per_serving, servings_per_container, category1, category2, avg_rating, review_count')
        .or(`title.ilike.%${q}%,brand.ilike.%${q}%`)
        .order('review_count', { ascending: false, nullsFirst: false } as any)
        .limit(20)
      console.log('[catalog/search] iherb_products result:', { count: (ih || []).length, error: ihErr || null })
      if (!ihErr) {
        for (const row of ih || []) {
          const name = row.title ?? null
          const brand = row.brand ?? null
          const k = keyOf(name, brand)
          if (!name || seen.has(k)) continue
          seen.add(k)
          results.push({
            // Keep id as a string; include source to avoid ambiguity if another table shares ids
            id: String(row.id),
            source: 'iherb_products',
            name: String(name),
            brand: brand ? String(brand) : null,
            category: row.category2 ?? row.category1 ?? null,
            typical_price: row.price ?? null,
            price_per_serving: row.price_per_serving ?? null,
            servings_per_container: row.servings_per_container ?? null,
            serving_size: null,
            image_url: null,
            iherb_url: row.url ?? null,
            avg_rating: row.avg_rating ?? null,
            review_count: row.review_count ?? null,
          })
        }
      }
    } catch (e: any) {
      console.log('[catalog/search] iherb_products query failed (ignored):', e?.message || e)
    }

    // 2) Backfill from supplement_catalog (legacy dataset) if < 20 results
    if (results.length < 20) {
      const remaining = 20 - results.length
      try {
        const { data: sc, error: scErr } = await supabaseAdmin
          .from('supplement_catalog')
          .select('*')
          .or(`name.ilike.%${q}%,brand.ilike.%${q}%,category.ilike.%${q}%`)
          .limit(Math.max(remaining, 0))
        console.log('[catalog/search] supplement_catalog backfill:', { count: (sc || []).length, error: scErr || null })
        if (!scErr) {
          for (const row of sc || []) {
            const name = row.name ?? null
            const brand = row.brand ?? row.manufacturer ?? null
            const k = keyOf(name, brand)
            if (!name || seen.has(k)) continue
            seen.add(k)
            results.push({
              id: String(row.id),
              source: 'supplement_catalog',
              name: String(name),
              brand: brand ? String(brand) : null,
              category: row.category ?? null,
              typical_price: row.typical_price ?? row.price_usd ?? row.price ?? null,
              servings_per_container: row.servings_per_container ?? row.servings ?? null,
              serving_size: row.serving_size ?? null,
              image_url: row.image_url ?? row.image ?? null,
              iherb_url: row.iherb_url ?? row.source_url ?? row.url ?? null,
            })
            if (results.length >= 20) break
          }
        }
      } catch (e: any) {
        console.log('[catalog/search] supplement_catalog backfill failed (ignored):', e?.message || e)
      }
    }

    return NextResponse.json(results.slice(0, 20))
  } catch (e: any) {
    console.error('Catalog search error:', e)
    return NextResponse.json([], { status: 200 })
  }
}


