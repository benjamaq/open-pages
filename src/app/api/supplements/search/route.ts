import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const qRaw = (url.searchParams.get('q') || '').trim()
    if (!qRaw) {
      return NextResponse.json({ results: [] })
    }
    // Basic guard against extremely short queries to reduce noise
    const q = qRaw.length >= 2 ? qRaw : ''
    if (!q) {
      return NextResponse.json({ results: [] })
    }

    const supabase = await createClient()

    // Multi-word AND search across title OR brand for each term; order by popularity, limit 30
    // Example: "Nordic Magnesium" => (title ilike %Nordic% OR brand ilike %Nordic%) AND (title ilike %Magnesium% OR brand ilike %Magnesium%)
    const terms = q.split(/\s+/).map(s => s.trim()).filter(Boolean)
    let query = supabase
      .from('iherb_products')
      .select('id,title,brand,price_per_serving,servings_per_container,category2,review_count,url')
    if (terms.length === 0) {
      return NextResponse.json({ results: [] })
    }
    for (const term of terms) {
      const likeTerm = `%${term}%`
      query = query.or(`title.ilike.${likeTerm},brand.ilike.${likeTerm}`)
    }
    const { data, error } = await query
      .order('review_count', { ascending: false, nullsFirst: false })
      .limit(30)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      results: (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        brand: row.brand,
        price_per_serving: row.price_per_serving,
        servings_per_container: row.servings_per_container,
        category2: row.category2,
        url: row.url
      }))
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}


