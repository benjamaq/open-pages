import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, try by user_supplement.id (legacy/detail page expectation)
    const { data: supplement, error } = await supabase
      .from('user_supplement')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (supplement && !error) {
      return NextResponse.json(supplement);
    }

    // If not found, try interpreting the id as a stack_items.id (from patterns list)
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (pErr) {
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: stackItem, error: sErr } = await supabase
      .from('stack_items')
      .select('*')
      .eq('id', params.id)
      .eq('profile_id', (profile as any).id)
      .maybeSingle();
    if (sErr) {
      return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
    if (!stackItem) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Normalize stack_items shape to what the detail page expects
    const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
    const name = String((stackItem as any).name || 'Supplement');
    const monthlyCost = Number((stackItem as any).monthly_cost ?? 0);
    const clampedMonthly = isNaN(monthlyCost) ? 0 : clamp(monthlyCost, 0, 80);

    const rawTags: string[] =
      Array.isArray((stackItem as any).primary_goal_tags) ? (stackItem as any).primary_goal_tags :
      Array.isArray((stackItem as any).tags) ? (stackItem as any).tags : [];
    const inferredFromName =
      rawTags.length > 0 ? [] :
      name.toLowerCase().includes('creatine') ? ['energy', 'athletic'] :
      name.toLowerCase().includes('magnesium') ? ['sleep', 'stress'] :
      name.toLowerCase().includes('omega') ? ['mood', 'inflammation'] :
      name.toLowerCase().includes('vitamin d') ? ['immunity'] :
      [];
    const primaryGoalTags = rawTags.length > 0 ? rawTags : inferredFromName;

    // Compute caveats from daily_entries since start_date (fallback: last 60 days)
    const startDate = (stackItem as any).start_date ?? (stackItem as any).created_at ?? null
    const since = startDate ? new Date(startDate) : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const sinceStr = since.toISOString().slice(0, 10)
    let caveats: any = null
    try {
      const { data: entries } = await supabase
        .from('daily_entries')
        .select('local_date, wearables')
        .eq('user_id', user.id)
        .gte('local_date', sinceStr)
        .order('local_date', { ascending: true })
      let totalDays = 0
      let daysWithHRV = 0
      const hrvValues: number[] = []
      const asleepMins: number[] = []
      let alcoholDays = 0
      let travelDays = 0
      for (const r of entries || []) {
        totalDays++
        const w = (r as any).wearables || {}
        const hrv = Number(w.hrv ?? w.heart_rate_variability ?? NaN)
        if (!isNaN(hrv)) {
          daysWithHRV++
          hrvValues.push(hrv)
        }
        const asleep = Number(w.asleep_duration_min ?? NaN)
        if (!isNaN(asleep)) asleepMins.push(asleep)
        if (w.alcohol === true || w.alcohol_consumed === true) alcoholDays++
        if (w.travel === true || w.timezone_change === true) travelDays++
      }
      const mean = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0
      const stddev = (arr: number[]) => {
        if (arr.length < 2) return 0
        const m = mean(arr)
        const v = arr.reduce((a,b)=>a + (b-m)*(b-m), 0) / (arr.length - 1)
        return Math.sqrt(v)
      }
      const hrvMean = mean(hrvValues)
      let illnessDays = 0
      if (hrvMean > 0) {
        const threshold = 0.8 * hrvMean
        for (const v of hrvValues) {
          if (v > 0 && v < threshold) illnessDays++
        }
      }
      const sleepVarianceMinutes = Math.round(stddev(asleepMins))
      const dataCompleteness = totalDays > 0 ? Math.round((daysWithHRV / totalDays) * 100) : 0
      caveats = {
        illnessDays,
        alcoholDays,
        travelDays,
        sleepVarianceMinutes,
        dataCompleteness
      }
    } catch {}

    const normalized = {
      // Keep original id for routing consistency
      id: (stackItem as any).id,
      name,
      brand_name: (stackItem as any).brand_name ?? null,
      primary_goal_tags: primaryGoalTags,
      monthly_cost_usd: clampedMonthly,
      start_date: startDate,
      time_of_day: (stackItem as any).time_of_day ?? null,
      with_food: (stackItem as any).with_food ?? null,
      daily_dose_amount: (stackItem as any).daily_dose_amount ?? null,
      daily_dose_unit: (stackItem as any).daily_dose_unit ?? null,
      caveats,
      // Additional raw fields in case the UI can use them
      _source: 'stack_items',
      _raw: stackItem
    };

    return NextResponse.json(normalized);
    
  } catch (error) {
    console.error('Error fetching supplement:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawCost =
      typeof body?.monthly_cost === 'number' ? body.monthly_cost :
      typeof body?.monthly_cost_usd === 'number' ? body.monthly_cost_usd :
      parseFloat(String(body?.monthly_cost || body?.monthly_cost_usd || 'NaN'));
    if (isNaN(rawCost)) {
      return NextResponse.json({ error: 'Invalid cost value' }, { status: 400 });
    }
    const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
    const monthlyCost = clamp(Number(rawCost), 0, 80);

    // Resolve profile
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Update stack_items (patterns and dashboard use stack_items.monthly_cost)
    const { data: updated, error: uErr } = await supabase
      .from('stack_items')
      .update({ monthly_cost: monthlyCost })
      .eq('id', params.id)
      .eq('profile_id', (profile as any).id)
      .select('id, monthly_cost')
      .maybeSingle();
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ id: updated.id, monthly_cost: updated.monthly_cost });
  } catch (error: any) {
    console.error('Error updating monthly cost:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


