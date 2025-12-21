import { test, expect } from '@playwright/test';
import { computeEffectPct, estimateConfidence, encodeMood } from '../src/lib/engine';

test('effect and confidence basic', () => {
  const days = [
    // 10 control days (mostly ok)
    ...Array.from({length:10}, (_,i)=>({date:`2025-01-${String(i+1).padStart(2,'0')}`, mood:'ok',   treated:false})),
    // 10 treated days (mostly sharp)
    ...Array.from({length:10}, (_,i)=>({date:`2025-02-${String(i+1).padStart(2,'0')}`, mood:'sharp', treated:true})),
  ] as any;

  const { effectPct, n } = computeEffectPct(days);
  expect(n).toBe(10);
  expect(effectPct).toBeGreaterThan(0);

  const treated = days.filter((d:any)=>d.treated).map((d:any)=>encodeMood(d.mood));
  const control = days.filter((d:any)=>!d.treated).map((d:any)=>encodeMood(d.mood));
  const conf = estimateConfidence(treated, control);
  expect(conf).toBeGreaterThan(50);
});


