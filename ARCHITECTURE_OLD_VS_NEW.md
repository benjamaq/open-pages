# BioStackr Architecture – Old (Conditions) vs New (Supplements)

This document clarifies boundaries between the legacy Conditions product and the new Supplements product. It is non-invasive and reflects current code; no behavior changes.

## Conditions (Legacy Pattern Recognition)
- Purpose: chronic condition tracking (pain, migraines, sleep), lifestyle correlations, symptom patterns.
- Primary data: `daily_entries`, `elli_messages` (insights store), `profiles.condition_*`.
- Key routes:
  - `/patterns` (dashboard of insights)
  - `/api/insights` (read persisted insights)
  - `/api/debug/integration/insights` (recompute)
  - `/api/cron/weekly-analysis` (scheduled batch)
- Namespaced exports: `src/lib/conditions`
- Core logic:
  - `src/lib/insights/*`
  - Correlation engine: `src/lib/insights/correlation-engine/*`

## Supplements (Truth Engine)
- Purpose: supplement testing, stack, truth engine, ROI.
- Primary data: `stack_items`, `intervention_periods`, `supplement_logs`, `pattern_insights`.
- Key routes:
  - `/dash` (dashboard)
  - `/api/dashboard/summary`
  - `/api/engine/recompute`
- Namespaced exports: `src/lib/supplements`
- Core logic:
  - `src/lib/engine/*`, `src/lib/engine-db.ts`

## Safety Boundaries
- Conditions writes insights to `elli_messages`; Supplements writes analysis to `pattern_insights`.
- No cross-writes by default.
- New facade routes:
  - `/conditions` → redirects to `/patterns`
  - `/supplements` → redirects to `/dash`

## Migration Readiness
- These namespaces allow future monorepo split with minimal file movement:
  - `apps/conditions` would import from `packages/conditions`
  - `apps/supplements` would import from `packages/supplements`


