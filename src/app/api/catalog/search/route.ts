import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    if (q.length < 2) return NextResponse.json([])

    console.log('[catalog/search] query:', q)
    console.log('[catalog/search] service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Query with service role (bypasses RLS for public catalog reads)
    const { data, error } = await supabaseAdmin
      .from('supplement_catalog')
      .select('*')
      .or(`name.ilike.%${q}%,brand.ilike.%${q}%,category.ilike.%${q}%`)
      .limit(20)

    console.log('[catalog/search] result:', { count: (data || []).length, error: error || null })
    if (error) throw error

    const normalized = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      brand: row.brand ?? row.manufacturer ?? null,
      category: row.category ?? null,
      typical_price: row.typical_price ?? row.price_usd ?? row.price ?? null,
      servings_per_container: row.servings_per_container ?? row.servings ?? null,
      serving_size: row.serving_size ?? null,
      image_url: row.image_url ?? row.image ?? null,
      iherb_url: row.iherb_url ?? row.source_url ?? row.url ?? null,
    }))
    return NextResponse.json(normalized)
  } catch (e: any) {
    console.error('Catalog search error:', e)
    return NextResponse.json([], { status: 200 })
  }
}


