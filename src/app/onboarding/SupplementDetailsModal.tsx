'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { HEALTH_PRIORITIES } from '@/lib/types';

// Shorter labels for tight mobile chips
const MOBILE_SHORT_LABEL: Record<string, string> = {
  cognitive: 'Cognitive',
  energy: 'Energy & stamina',
  mood: 'Stress & mood',
  athletic: 'Athletic',
  joint: 'Joint & bone',
  beauty: 'Skin & hair',
};

export interface ProductLike {
  id: string;
  productName: string;
  brandName: string;
  canonicalSupplementId: string;
  pricePerContainerDefault: number;
  servingsPerContainerDefault: number;
  dosePerServingAmountDefault: number;
  dosePerServingUnitDefault: string;
}

export interface SupplementDetails {
  productId: string;
  name: string;
  brandName: string;
  canonicalSupplementId: string;
  dailyDose: number;
  doseUnit: string;
  daysPerWeek: number;
  servingsPerDay?: number;
  pricePerContainer: number;
  servingsPerContainer: number;
  primaryGoals: string[];
  monthlyCost: number;
  // Schedule details
  scheduleType?: 'every_day' | 'weekdays' | 'weekends' | 'as_needed' | 'cycling';
  cycleDaysOn?: number;
  cycleDaysOff?: number;
  timeOfDay?: Array<'morning' | 'afternoon' | 'evening' | 'night'>;
  // Timeline
  startedAt?: string; // YYYY-MM-DD
  isActive?: boolean;
  stoppedAt?: string;
  restartedAt?: string;
  intakePeriods?: Array<{ startedAt: string; stoppedAt: string }>;
}

export function SupplementDetailsModal({
  product,
  initial,
  onCancel,
  onSave,
}: {
  product: ProductLike;
  initial?: Partial<SupplementDetails>;
  onCancel: () => void;
  onSave: (details: SupplementDetails) => void;
}) {
  const CatalogSearch = dynamic(() => import('@/components/SupplementSearchInput'), { ssr: false })
  // Catalog overrides (when user selects from search)
  const [overrideName, setOverrideName] = useState<string | undefined>(undefined)
  const [overrideBrand, setOverrideBrand] = useState<string | undefined>(undefined)
  const [overrideServingSize, setOverrideServingSize] = useState<string | undefined>(undefined)
  const [overrideImage, setOverrideImage] = useState<string | undefined>(undefined)
  const [overrideUrl, setOverrideUrl] = useState<string | undefined>(undefined)
  const [dailyDose, setDailyDose] = useState<number>(initial?.dailyDose ?? product.dosePerServingAmountDefault ?? 1);
  const [doseUnit, setDoseUnit] = useState<string>(initial?.doseUnit ?? product.dosePerServingUnitDefault ?? '');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(initial?.daysPerWeek ?? 7);
  const [scheduleType, setScheduleType] = useState<SupplementDetails['scheduleType']>(initial?.scheduleType ?? 'every_day');
  const [cycleDaysOn, setCycleDaysOn] = useState<number>(initial?.cycleDaysOn ?? 5);
  const [cycleDaysOff, setCycleDaysOff] = useState<number>(initial?.cycleDaysOff ?? 2);
  const [timeOfDay, setTimeOfDay] = useState<NonNullable<SupplementDetails['timeOfDay']>>(initial?.timeOfDay ?? []);
  // Use string inputs to avoid controlled-number typing issues
  const [pricePerContainerInput, setPricePerContainerInput] = useState<string>(
    initial?.pricePerContainer != null
      ? String(initial.pricePerContainer)
      : (product.pricePerContainerDefault != null ? String(product.pricePerContainerDefault) : '')
  );
  const [servingsPerContainerInput, setServingsPerContainerInput] = useState<string>(
    initial?.servingsPerContainer != null
      ? String(initial.servingsPerContainer)
      : (product.servingsPerContainerDefault != null ? String(product.servingsPerContainerDefault) : '')
  );
  const [servingsPerDayInput, setServingsPerDayInput] = useState<string>(
    initial?.servingsPerDay != null ? String(initial.servingsPerDay) : '1'
  );
  const [primaryGoals, setPrimaryGoals] = useState<string[]>(initial?.primaryGoals ?? []);
  const [notSure, setNotSure] = useState<boolean>(false);
  const [startedAt, setStartedAt] = useState<string>(initial?.startedAt ?? '');
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [stoppedAt, setStoppedAt] = useState<string>(initial?.stoppedAt ?? '');
  const [restartedAt, setRestartedAt] = useState<string>(initial?.restartedAt ?? '');
  const [intakePeriods, setIntakePeriods] = useState<Array<{ startedAt: string; stoppedAt: string }>>(initial?.intakePeriods ?? []);

  const pricePerContainer = useMemo(() => {
    const n = parseFloat(pricePerContainerInput.replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  }, [pricePerContainerInput])
  const servingsPerContainer = useMemo(() => {
    const n = parseFloat(servingsPerContainerInput.replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  }, [servingsPerContainerInput])
  const servingsPerDay = useMemo(() => {
    const n = parseFloat(servingsPerDayInput.replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  }, [servingsPerDayInput])

  const effectiveDaysPerWeek = useMemo(() => {
    if (scheduleType === 'every_day') return 7;
    if (scheduleType === 'weekdays') return 5;
    if (scheduleType === 'weekends') return 2;
    if (scheduleType === 'cycling') {
      const on = Math.max(0, Number(cycleDaysOn) || 0);
      const off = Math.max(0, Number(cycleDaysOff) || 0);
      const total = on + off;
      if (total === 0) return 0;
      return (on / total) * 7;
    }
    // as_needed → let user-provided daysPerWeek stand
    return Math.max(0, Math.min(7, Number(daysPerWeek) || 0));
  }, [scheduleType, cycleDaysOn, cycleDaysOff, daysPerWeek]);

  const monthlyCost = useMemo(() => {
    // Use servings per day for cost, not mg dose
    if (!pricePerContainer || !servingsPerContainer || !servingsPerDay) return 0;
    const costPerServing = pricePerContainer / servingsPerContainer;
    const avgServingsPerDay = servingsPerDay * (effectiveDaysPerWeek / 7);
    const monthly = costPerServing * avgServingsPerDay * 30;
    return Math.round(monthly * 100) / 100;
  }, [pricePerContainer, servingsPerContainer, servingsPerDay, effectiveDaysPerWeek]);

  function handleCatalogSelect(item: any) {
    // Populate overrides + cost fields
    setOverrideName(item?.name || undefined)
    setOverrideBrand(item?.brand || undefined)
    setOverrideServingSize(item?.serving_size || undefined)
    setOverrideImage(item?.image_url || undefined)
    setOverrideUrl(item?.iherb_url || undefined)
    if (item?.typical_price != null) setPricePerContainerInput(String(item.typical_price))
    if (item?.servings_per_container != null) setServingsPerContainerInput(String(item.servings_per_container))
    // eslint-disable-next-line no-console
    console.log('Catalog selection → autofill', item)
  }

  function toggleGoal(key: string) {
    if (notSure) return;
    setPrimaryGoals((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : prev.length < 2 ? [...prev, key] : prev));
  }

  // Build simple 6‑month usage timeline bars for visual feedback
  function buildTimelineBars() {
    const today = new Date()
    const startRef = new Date(today)
    startRef.setMonth(startRef.getMonth() - 5)
    startRef.setDate(1)
    const months: Date[] = []
    const cur = new Date(startRef)
    while (cur <= today) {
      months.push(new Date(cur))
      cur.setMonth(cur.getMonth() + 1)
    }
    const spans: Array<{ start: Date; end: Date }> = []
    if (startedAt) {
      const s = new Date(startedAt)
      const e = isActive === false && stoppedAt ? new Date(stoppedAt) : today
      spans.push({ start: s, end: e })
    }
    for (const p of intakePeriods) {
      if (!p.startedAt) continue
      const s = new Date(p.startedAt)
      const e = p.stoppedAt ? new Date(p.stoppedAt) : today
      spans.push({ start: s, end: e })
    }
    const total = Math.max(1, today.getTime() - startRef.getTime())
    const bars = spans.map((sp) => {
      const segStart = Math.max(startRef.getTime(), sp.start.getTime())
      const segEnd = Math.min(today.getTime(), sp.end.getTime())
      const left = Math.max(0, Math.min(1, (segStart - startRef.getTime()) / total))
      const width = Math.max(0.02, Math.min(1, (segEnd - segStart) / total))
      return { leftPct: left * 100, widthPct: width * 100 }
    })
    return { months, bars }
  }

  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center">
     <div className="absolute inset-0 bg-slate-900/60" onClick={onCancel} />
     <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
       <div className="flex items-center justify-between mb-4">
         <div>
          <div className="text-lg font-semibold text-slate-900">{overrideName || product.productName}</div>
          <div className="text-sm text-slate-500">{overrideBrand || product.brandName}</div>
          <div className="text-xs text-slate-500 mt-1">You can change any of this later.</div>
         </div>
         <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">✕</button>
       </div>

      <div className="space-y-6 max-h-[78vh] overflow-y-auto pr-1" tabIndex={-1}>
        {/* Catalog Search */}
        <section className="rounded-xl border border-[#E4E1DC] bg-[#F6F5F3] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Find product</div>
          <CatalogSearch onSelect={handleCatalogSelect} />
        </section>

        {/* Manual name entry for items not in catalog */}
        <section className="rounded-xl border border-[#E4E1DC] bg-white p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-slate-700">
              Supplement name
              <input
                type="text"
                value={overrideName ?? ''}
                onChange={(e) => setOverrideName(e.target.value)}
                placeholder={product.productName || 'e.g., Vitamin C'}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label className="text-xs text-slate-700">
              Brand (optional)
              <input
                type="text"
                value={overrideBrand ?? ''}
                onChange={(e) => setOverrideBrand(e.target.value)}
                placeholder={product.brandName || 'Brand name'}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
          </div>
        </section>

         {/* Section A — How you take it */}
         <section className="rounded-xl border border-[#E4E1DC] bg-[#F6F5F3] p-4">
           <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">How you take it</div>
           <div>
             <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Daily dose</div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                value={dailyDose}
                onChange={(e) => setDailyDose(Number(e.target.value))}
                onWheel={(e) => { try { (e.currentTarget as HTMLInputElement).blur() } catch {} }}
                className="w-24 px-3 py-2 border border-slate-300 rounded-md"
              />
              <select value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)} className="w-44 px-3 py-2 border border-slate-300 rounded-md">
                <option value="mg">mg</option>
                <option value="g">grams</option>
                <option value="mcg">mcg</option>
                <option value="IU">IU</option>
                <option value="ml">ml</option>
                <option value="capsules">capsules</option>
              </select>
             <span className="text-sm text-slate-500">per day</span>
           </div>
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">When do you usually take it? (optional)</div>
              <div className="flex flex-wrap gap-2">
                {(['morning','afternoon','evening','night']).map((t: 'morning' | 'afternoon' | 'evening' | 'night') => {
                  const selected = timeOfDay.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setTimeOfDay(selected ? timeOfDay.filter(x => x !== t) : [...timeOfDay, t])}
                      className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${selected ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'bg-white text-slate-700 border-[#E4E1DC] hover:border-slate-400'}`}
                    >
                      {t === 'morning' ? 'Morning' : t === 'afternoon' ? 'Afternoon' : t === 'evening' ? 'Evening' : 'Night'}
                    </button>
                  )
                })}
              </div>
            </div>
           <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">How often?</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={scheduleType === 'every_day'}
                onClick={() => { setScheduleType('every_day'); setDaysPerWeek(7); }}
                className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${scheduleType === 'every_day' ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'bg-white text-slate-700 border-[#E4E1DC] hover:border-slate-400'}`}
              >
                Every day
              </button>
              <button
                type="button"
                aria-pressed={scheduleType === 'weekdays'}
                onClick={() => { setScheduleType('weekdays'); setDaysPerWeek(5); }}
                className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${scheduleType === 'weekdays' ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'bg-white text-slate-700 border-[#E4E1DC] hover:border-slate-400'}`}
              >
                Weekdays only
              </button>
              <button
                type="button"
                aria-pressed={scheduleType === 'weekends'}
                onClick={() => { setScheduleType('weekends'); setDaysPerWeek(2); }}
                className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${scheduleType === 'weekends' ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'bg-white text-slate-700 border-[#E4E1DC] hover:border-slate-400'}`}
              >
                Weekends only
              </button>
              <button
                type="button"
                aria-pressed={scheduleType === 'as_needed'}
                onClick={() => setScheduleType('as_needed')}
                className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${scheduleType === 'as_needed' ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'bg-white text-slate-700 border-[#E4E1DC] hover:border-slate-400'}`}
              >
                As needed
              </button>
            </div>
           </div>
           {/* close mt-4 container */}
           </div>
         </section>

         {/* micro divider */}
         <hr className="my-2 border-t" style={{ borderColor: '#E4E1DC' }} />

         {/* Section B — Why you’re taking this */}
         <section className="rounded-xl border border-[#E4E1DC] bg-[#F6F5F3] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">What are you taking this for?</div>
          <div className="text-xs text-slate-600 mb-1">Your hypothesis — we&apos;ll test what it actually affects</div>
          <div className="text-xs text-slate-500 mb-3">Helps us group results and spot patterns faster.</div>
           <div className="mb-2">
             <button
               type="button"
               onClick={() => { setNotSure(!notSure); if (!notSure) setPrimaryGoals([]) }}
               className={`rounded-full px-3.5 py-2 text-sm border ${notSure ? 'bg-white border-[#55514A] text-slate-900' : 'border-[#E4E1DC] bg-white text-slate-700'}`}
             >
               Not sure yet — Skip for now
             </button>
           </div>
           <div className="grid grid-cols-2 gap-2">
             {HEALTH_PRIORITIES.map(p => {
               const selected = primaryGoals.includes(p.key);
               const labelSm = MOBILE_SHORT_LABEL[p.key] || p.label;
               return (
               <button
                 key={p.key}
                 onClick={() => toggleGoal(p.key)}
                 disabled={notSure}
                 className={`rounded-full h-9 sm:h-10 px-3 text-[13px] leading-tight text-left border flex items-center whitespace-nowrap overflow-hidden text-ellipsis ${selected ? 'bg-[#F6F5F3] border-[#55514A] text-slate-900' : 'border-[#E4E1DC] bg-white text-slate-700'} ${notSure ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 <span className="sm:hidden">{labelSm}</span>
                 <span className="hidden sm:inline">{p.label}</span>
                 </button>
               )
             })}
           </div>
           <div className="text-xs text-slate-500 mt-1">Select up to 2.</div>
         </section>

         {/* Section C — Timing & context */}
         <section className="rounded-xl border border-[#E4E1DC] bg-[#F6F5F3] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Timing & context</div>
          <div className="text-xs text-slate-700 mb-2 max-w-prose">
            <span className="mr-1">⚡</span>
            <span className="font-semibold">Accurate dates = accurate verdicts.</span> We compare your health before vs after you started.
          </div>
           <div className="grid grid-cols-2 gap-3">
             <label className="text-xs text-slate-700">
               When did you start?
              <input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                max={new Date().toISOString().slice(0,10)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
              />
              <div className="mt-1 text-[11px] text-slate-500">Tip: scroll to pick earlier years.</div>
             </label>
             <div className="text-xs text-slate-700">
               Are you still taking it?
               <div className="mt-1 flex items-center gap-2">
               <button
                 type="button"
                 aria-pressed={isActive}
                 onClick={() => setIsActive(true)}
                 className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${isActive ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'bg-white text-slate-700 border-[#E4E1DC] hover:border-slate-400'}`}
               >
                 Yes
               </button>
               <button
                 type="button"
                 aria-pressed={!isActive}
                 onClick={() => setIsActive(false)}
                 className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${!isActive ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'bg-white text-slate-700 border-[#E4E1DC] hover:border-slate-400'}`}
               >
                 No
               </button>
               </div>
             </div>
            {!isActive && (
               <>
                 <label className="text-xs text-slate-700">
                   Stopped on
                  <input
                    type="date"
                    value={stoppedAt}
                    onChange={(e) => setStoppedAt(e.target.value)}
                    max={new Date().toISOString().slice(0,10)}
                    className={`mt-1 w-full px-3 py-2 border rounded-md ${(!stoppedAt ? 'border-red-400' : 'border-slate-300')}`}
                    required
                  />
                 </label>
                 <label className="text-xs text-slate-700">
                   Restarted later? (optional)
                  <input
                    type="date"
                    value={restartedAt}
                    onChange={(e) => setRestartedAt(e.target.value)}
                    max={new Date().toISOString().slice(0,10)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                 </label>
               </>
             )}
           </div>
           <div className="mt-4">
             <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Additional intake periods</div>
             {intakePeriods.length === 0 && (
               <div className="text-xs text-slate-500 mb-2">Add past start/stop windows to capture breaks.</div>
             )}
             <div className="space-y-2">
               {intakePeriods.map((p, i) => (
                 <div key={i} className="grid grid-cols-2 gap-2 items-end">
                   <label className="text-xs text-slate-700">
                     Started
                     <input type="date" value={p.startedAt} max={new Date().toISOString().slice(0,10)} onChange={(e) => {
                       const next = [...intakePeriods]; next[i] = { ...next[i], startedAt: e.target.value }; setIntakePeriods(next)
                     }} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md" />
                   </label>
                   <div className="flex items-end gap-2">
                     <label className="flex-1 text-xs text-slate-700">
                       Stopped
                       <input type="date" value={p.stoppedAt} max={new Date().toISOString().slice(0,10)} onChange={(e) => {
                         const next = [...intakePeriods]; next[i] = { ...next[i], stoppedAt: e.target.value }; setIntakePeriods(next)
                       }} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md" />
                     </label>
                     <button onClick={() => setIntakePeriods(intakePeriods.filter((_, idx) => idx !== i))} className="px-3 py-2 text-sm border border-slate-300 rounded-md">Remove</button>
                   </div>
                 </div>
               ))}
             </div>
             <button onClick={() => setIntakePeriods([...intakePeriods, { startedAt: '', stoppedAt: '' }])} className="mt-2 px-3 py-2 text-sm border border-slate-300 rounded-md">+ Add period</button>
           </div>
           {/* Visual usage timeline */}
           {(() => {
             const t = buildTimelineBars()
             return (
               <div className="mt-6">
                 <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Usage timeline</div>
                 <div className="mb-1 flex justify-between text-[11px] text-slate-500 px-1">
                   {t.months.map((m, i) => <span key={i}>{m.toLocaleDateString(undefined, { month: 'short' })}</span>)}
                 </div>
                 <div className="relative h-8 rounded-md bg-white border border-[#E4E1DC] overflow-hidden">
                   {t.bars.map((b, i) => (
                     <div key={i} className="absolute top-2 bottom-2 rounded bg-[#6F7F5A]" style={{ left: `${b.leftPct}%`, width: `${b.widthPct}%` }} />
                   ))}
                   <div className="absolute top-0 bottom-0 w-[2px] bg-[#C65A2E]" style={{ right: 0 }} />
                 </div>
               </div>
             )
           })()}
         </section>

         {/* Section D — Cost (optional) */}
         <section className="rounded-xl border border-[#EDEAE4] bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Cost (optional)</div>
          <div className="grid grid-cols-2 gap-3">
             <div>
               <div className="text-xs text-slate-500 mb-1">Container price</div>
                 <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  value={pricePerContainerInput}
                  onChange={(e) => setPricePerContainerInput(e.target.value)}
                  onWheel={(e) => { try { (e.currentTarget as HTMLInputElement).blur() } catch {} }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
             </div>
             <div>
               <div className="text-xs text-slate-500 mb-1">Servings per container</div>
               <input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min={1}
                  value={servingsPerContainerInput}
                  onChange={(e) => setServingsPerContainerInput(e.target.value)}
                  onWheel={(e) => { try { (e.currentTarget as HTMLInputElement).blur() } catch {} }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
             </div>
           </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Servings per day</div>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                value={servingsPerDayInput}
                onChange={(e) => setServingsPerDayInput(e.target.value)}
                onWheel={(e) => { try { (e.currentTarget as HTMLInputElement).blur() } catch {} }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
           <div className="mt-3 text-sm text-slate-600">
            Monthly cost: <span className="font-semibold text-slate-900">${monthlyCost.toFixed(2)}</span> <span className="ml-1 text-slate-500">Used to calculate what’s worth keeping.</span>
           </div>
         </section>
       </div>

       <div className="mt-6 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-700">Cancel</button>
         <button
           onClick={() =>
              (function() {
                // Require a stop date if user is not currently taking it
                if (!isActive && !stoppedAt) {
                  // Simple form validation feedback via red border; also prevent submit
                  try { alert('Please enter the date you stopped taking it.'); } catch {}
                  return
                }
                // Debug logs for price-save issues
                // These print to the browser console when saving
                // eslint-disable-next-line no-console
                console.log('=== SAVING SUPPLEMENT ===', {
                  pricePerContainer,
                  servingsPerContainer,
                  monthlyCost,
                  effectiveDaysPerWeek,
                  primaryGoals: notSure ? [] : primaryGoals
                })
                try { console.log('MODAL primaryGoals:', notSure ? [] : primaryGoals) } catch {}
                onSave({
               productId: product.id,
               name: overrideName || product.productName,
               brandName: overrideBrand || product.brandName,
               canonicalSupplementId: product.canonicalSupplementId,
               dailyDose,
               doseUnit,
               daysPerWeek: Number(effectiveDaysPerWeek.toFixed(3)), // preserve effective average
               servingsPerDay,
               pricePerContainer,
               servingsPerContainer,
               primaryGoals: notSure ? [] : primaryGoals,
               monthlyCost: Math.min(Math.max(monthlyCost, 0), 80),
               scheduleType,
               cycleDaysOn,
               cycleDaysOff,
               timeOfDay,
               startedAt: startedAt || undefined,
               isActive,
               stoppedAt: stoppedAt || undefined,
               restartedAt: restartedAt || undefined,
               intakePeriods: intakePeriods.filter(p => p.startedAt && p.stoppedAt),
              })
              })()
           }
          className="px-5 h-11 text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold"
         >
          Add to stack
         </button>
       </div>
     </div>
   </div>
  );
}


