#!/usr/bin/env python3
"""
BioStackr cohort report v2 — config-driven metrics, generic PDF layout.

Usage (from repo root):
  export SUPABASE_URL="https://your-project.supabase.co"
  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
  python -m scripts.cohort_report_v2.generate_report --cohort donotage-suresleep
  python -m scripts.cohort_report_v2.generate_report --cohort seeking-health-optimal-focus
  python -m scripts.cohort_report_v2.generate_report --mock --cohort donotage-suresleep
  # With SUPABASE_* set, --mock still loads real cohort.checkin_fields; only entries are synthetic.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np

from .cohort_copy import get_cohort_copy
from .fetch import fetch_cohort_row, fetch_participants_and_entries, parse_checkin_fields
from .pdf_report import build_pdf
from .registry import pick_chart_metric, pick_primary_metric, resolve_metrics_for_cohort
from .stats_engine import analyse_cohort

# Offline mock metadata only — keep in sync with supabase migrations for known slugs.
# When SUPABASE_* env is set, mock mode loads the real cohort row instead (checkin_fields from DB).
_MOCK_OFFLINE_COHORTS: dict[str, dict[str, Any]] = {
    "donotage-suresleep": {
        "id": "00000000-0000-4000-8000-000000000001",
        "brand_name": "DoNotAge",
        "product_name": "SureSleep",
        "study_days": 21,
        "checkin_fields": ["sleep_quality", "energy", "sleep_onset_bucket", "night_wakes"],
    },
    "seeking-health-optimal-focus": {
        "id": "00000000-0000-4000-8000-000000000002",
        "brand_name": "Seeking Health",
        "product_name": "Optimal Focus",
        "study_days": 21,
        "checkin_fields": ["focus", "energy", "mental_clarity"],
    },
    "placeholder-cohort-v1": {
        "id": "00000000-0000-4000-8000-000000000003",
        "brand_name": "BioStackr Internal",
        "product_name": "Placeholder Product (draft — not for external use)",
        "study_days": 21,
        "checkin_fields": ["energy", "mood", "calmness"],
    },
}


def _cohort_row_for_mock(cohort_slug: str) -> dict[str, Any]:
    slug = str(cohort_slug or "").strip().lower()
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if url and key:
        print("Mock mode: loading cohort row from Supabase (checkin_fields from DB)…")
        return fetch_cohort_row(slug)

    base = _MOCK_OFFLINE_COHORTS.get(slug)
    if base:
        print(f"Mock mode: offline stub for `{slug}` (no Supabase env — using repo-aligned checkin_fields).")
        return {"slug": slug, **base}
    print(
        f"Mock mode: unknown slug `{slug}` — using generic 3-slider stub "
        "(energy, mood, calmness). Set SUPABASE_* to read real checkin_fields from DB."
    )
    return {
        "id": "00000000-0000-4000-8000-000000000099",
        "slug": slug,
        "brand_name": "Mock Brand",
        "product_name": "Mock Product",
        "study_days": 21,
        "checkin_fields": ["energy", "mood", "calmness"],
    }


def run_mock(cohort_slug: str) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]]]:
    """Synthetic participants + entries. Cohort metadata (especially checkin_fields) from DB if env set, else offline stubs."""
    print("Running with MOCK DATA (synthetic daily_entries only)…")
    cohort = _cohort_row_for_mock(cohort_slug)
    participants = [{"user_id": f"user-{i}", "enrolled_at": "2026-03-01"} for i in range(20)]
    entries: list[dict[str, Any]] = []
    rng = np.random.default_rng(42)
    fields = list(cohort["checkin_fields"])
    for uid in [p["user_id"] for p in participants]:
        baseline = rng.uniform(3.5, 5.5)
        response = rng.uniform(0.7, 1.3)
        onset_day = int(rng.integers(4, 9))
        for day in range(1, 22):
            if rng.random() < 0.1:
                continue
            effect = max(0, (day - onset_day) / 16.0) * 2.2 * response if day >= onset_day else 0
            row: dict[str, Any] = {
                "user_id": uid,
                "local_date": f"2026-03-{day:02d}",
                "tags": ["high_stress"] if rng.random() < 0.08 else [],
            }
            for fk in fields:
                if fk in ("sleep_onset_bucket",):
                    row[fk] = (
                        int(rng.integers(1, 4)) if day < onset_day else int(rng.integers(1, 3))
                    )
                elif fk == "night_wakes":
                    row[fk] = int(rng.integers(0, 3)) if day < onset_day else int(rng.integers(0, 2))
                else:
                    sq = float(np.clip(baseline + effect + rng.normal(0, 0.4), 1, 10))
                    row[fk] = round(sq * 2) / 2
            entries.append(row)
    return cohort, participants, entries


def main() -> None:
    parser = argparse.ArgumentParser(description="BioStackr cohort report v2")
    parser.add_argument("--cohort", default="donotage-suresleep", help="Cohort slug")
    parser.add_argument("--out", default=None, help="Output PDF path")
    parser.add_argument("--mock", action="store_true", help="Synthetic data (no Supabase)")
    args = parser.parse_args()

    slug = str(args.cohort or "").strip().lower()
    if not slug:
        print("ERROR: --cohort required")
        sys.exit(1)

    if args.mock:
        cohort, participants, entries = run_mock(slug)
    else:
        cohort = fetch_cohort_row(slug)
        raw_fields = parse_checkin_fields(cohort.get("checkin_fields"))
        metric_defs = resolve_metrics_for_cohort(raw_fields)
        if not metric_defs:
            print("ERROR: No resolvable metrics in cohort.checkin_fields")
            sys.exit(1)
        participants, entries = fetch_participants_and_entries(cohort, metric_defs)

    raw_fields = parse_checkin_fields(cohort.get("checkin_fields"))
    metric_defs = resolve_metrics_for_cohort(raw_fields)
    if not metric_defs:
        print("ERROR: checkin_fields produced empty metric list after registry filter")
        sys.exit(1)

    print("Analysing…")
    stats, completed = analyse_cohort(participants, entries, metric_defs)

    primary = pick_primary_metric(metric_defs)
    if primary.key not in stats:
        for m in metric_defs:
            if m.key in stats:
                primary = m
                break
    if primary.key not in stats:
        print("ERROR: No participant-level stats for any configured metric (need more clean check-ins).")
        sys.exit(1)

    chart_metric = pick_chart_metric(metric_defs, primary)
    if chart_metric.kind != "slider" or chart_metric.key not in stats:
        for m in metric_defs:
            if m.kind == "slider" and m.key in stats:
                chart_metric = m
                break

    copy = get_cohort_copy(slug)
    out = args.out
    if not out:
        safe = "".join(c if c.isalnum() else "_" for c in str(cohort.get("product_name") or slug))
        out = str(Path.cwd() / f"BioStackr_{safe}_Cohort_Report_v2.pdf")

    build_pdf(
        cohort,
        participants,
        entries,
        stats,
        completed,
        metric_defs,
        primary,
        chart_metric,
        copy,
        out,
    )

    print(f"Completed participants (analysis): {completed}")
    for k, s in stats.items():
        print(f"  {k}: d={s['d']} ({s['d_label']}), {s['pct_improved']}% improved")


if __name__ == "__main__":
    main()
