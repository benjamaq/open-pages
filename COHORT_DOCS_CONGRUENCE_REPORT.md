# BioStackr Cohort Documents — Congruence Report

**Reviewed:** BioStackr_Cohort_Study_Overview_v2.pdf and BioStackr_Sample_Report_Final.pdf  
**Compared against:** Website copy (/cohorts), codebase, and product implementation

---

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| **Pricing** | ✅ Congruent | Matches |
| **Statistical methods** | ✅ Congruent | Cohen's d + bootstrap |
| **Outcomes & metrics** | ✅ Congruent | Sleep, energy, mood, focus 1–10 |
| **Wearables** | ✅ Congruent | Apple Health, WHOOP, Oura, Garmin |
| **Deliverables** | ✅ Congruent | Executive summary, full dataset, marketing claims |
| **Sample report** | ✅ Congruent | Clearly states fictional product |
| **Enrollment flow** | ⚠️ Review | Overview describes features not in codebase |
| **Weekly brand updates** | ⚠️ Review | Overview promises; no automation found |
| **Inaugural $0 fee** | ⚠️ Minor | Website doesn’t mention; Overview does |
| **Bootstrap iterations** | ⚠️ Minor | Overview says 1,000; code uses 400–800 |

---

## 1. BioStackr_Cohort_Study_Overview_v2.pdf

### ✅ Congruent

1. **Pricing:** 30-person $5k/$15k, 50-person $10k/$22k — matches website and Overview.
2. **Primary outcomes:** Sleep, energy, mood, focus (1–10) — matches check-in UI.
3. **Statistical methods:** Cohen's d effect size + bootstrap confidence intervals — implemented in `truthEngine`, `analysis/effect.ts`, `insights/utils/statistics.ts`.
4. **Wearables:** Apple Health, WHOOP, Oura, Garmin — listed in codebase and website.
5. **Confound tagging:** Alcohol, travel, illness, stress — present in `EnhancedDayDrawerV2`.
6. **Daily check-in:** Four sliders under 60 seconds — matches UX.
7. **Deliverables:** Executive summary, full dataset report, marketing claim examples — matches website.
8. **90-day exclusivity:** Mentioned in Overview and website.
9. **GDPR / data:** Overview describes anonymisation; no contradiction in code.
10. **Adverse events:** Overview describes referral to brand; no contradiction.

### ⚠️ Needs Review

1. **Dedicated study application page (not main BioStackr platform)**  
   Overview: “BioStackr-hosted study page — not the main BioStackr platform.”  
   Codebase: `/study/[brandcode]` redirects to `/signup`; no separate study application form.  
   **Action:** Confirm whether a separate study app exists or if this is manual/planned.

2. **First 80 qualified applicants auto-accepted**  
   Overview: “First 80 qualified applicants are automatically accepted. Once 80 spots are filled, the page switches to: cohort full — join waitlist.”  
   Codebase: No enrollment cap or waitlist logic.  
   **Action:** Confirm if this is manual or planned for future.

3. **Weekly compliance updates to brand**  
   Overview: “Plain-text summary sent to the brand throughout the study: active participant count, average check-in rate, and early directional trends.”  
   Codebase: No automation for brand-facing weekly reports.  
   **Action:** Confirm if this is manual or planned.

4. **Bootstrap iterations**  
   Overview: “1,000 resamples, 95% CI.”  
   Codebase: `effect.ts` uses 500 samples; `tag-analyzer` uses 400–800; `insights/utils` uses 1000.  
   **Action:** Decide whether cohort reports should use 1,000 iterations for consistency.

5. **Inaugural $0 fee**  
   Overview: “For Inaugural Partners, the standard $10,000 fee for the 50-person cohort study is waived entirely in exchange for case study rights.”  
   Website: Only mentions beta pricing.  
   **Action:** Either add website copy for inaugural pricing or clarify that it’s only for pilot partners.

### ⚠️ Baseline / outcome windows

Overview: “Days 1–3 baseline; Days 4–5 early study in baseline window; Outcome window Days 29–33.”  
Codebase: Truth Engine uses ON/OFF or implicit start; cohort study may use a different pre/post design.  
**Action:** Confirm whether cohort analysis uses the same baseline/outcome windows as the Overview.

---

## 2. BioStackr_Sample_Report_Final.pdf

### ✅ Congruent

1. **Fictional product:** “The product name used here is fictional. Results from live BioStackr studies reflect actual participant outcomes.” — correct.
2. **Primary outcomes:** Sleep, energy, mood, focus — matches.
3. **Cohen's d:** 0.71 (large) — matches methodology.
4. **Bootstrap CI:** 1,000 bootstrap resamples — matches Overview.
5. **Confound exclusion:** Alcohol, travel, illness, stress — matches Overview.
6. **Marketing claim tiers:** Long-form, landing page, ad creative — matches website.
7. **Wearable data:** 18 participants, sleep duration, HRV, sleep onset latency — matches wearable support.
8. **Study structure:** 47 participants, 30 days, 1,034 check-ins — matches website example numbers.
9. **“BioStackr does not make regulatory efficacy claims”** — appropriate disclaimer.

### ⚠️ Minor

1. **“500 invited”**  
   Overview: “Brand emails 300–800 existing customers.”  
   Sample report: “500 invited.”  
   **Action:** Either align to “300–800” or keep “500” as example.

2. **“52 enrolled” vs “~80 auto-accepted”**  
   Overview: “~80 participants — cohort cap enforced.”  
   Sample report: “52 enrolled.”  
   **Action:** Clarify sample as illustrative or align with Overview’s enrollment caps.

---

## 3. Website vs Documents

| Claim | Website | Overview | Sample Report |
|-------|---------|----------|---------------|
| 30-day study | ✅ | ✅ | ✅ |
| ≥20 check-ins to qualify | ❌ | ✅ | ✅ |
| Cohen's d + bootstrap | ✅ | ✅ | ✅ |
| Wearables | ✅ | ✅ | ✅ |
| Two reports delivered | ✅ | ✅ | ✅ |
| Within 2 weeks of study end | ✅ | ✅ | ✅ |
| “First qualified applicants” | ✅ | ✅ (80) | — |
| “Participants reviewed and selected” | ✅ | — | — |

**Action:** Add “≥20 check-ins” to website if that’s the real threshold.

---

## 4. Recommendations

1. **High priority:** Confirm enrollment flow (study app vs signup, 80-person cap, waitlist).  
2. **Medium priority:** Confirm whether weekly brand updates are manual or automated.  
3. **Low priority:** Align bootstrap iterations to 1,000 for cohort reports.  
4. **Copy:** Add inaugural $0 pricing to website if applicable.  
5. **Copy:** Add “≥20 check-ins to qualify” to website if accurate.

---

## 5. Overall Verdict

**No obvious misrepresentation.** The documents describe the platform and methodology correctly. The main gaps are:

- **Operational:** Enrollment flow and weekly brand updates may be manual or partially manual.
- **Copy:** A few small inconsistencies (bootstrap iterations, inaugural pricing, check-in threshold).

The sample report is clearly labelled as fictional and does not overstate claims.
