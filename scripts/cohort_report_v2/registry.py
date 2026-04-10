"""
Metric registry: single source of truth for report stats + PDF labels.
Keys MUST match public.daily_entries column names (and cohorts.checkin_fields).
"""

from dataclasses import dataclass
from typing import Literal

MetricKind = Literal["slider", "bucket", "count"]


@dataclass(frozen=True)
class MetricDef:
    """One measurable cohort check-in field stored on daily_entries."""

    key: str
    label: str
    table_label: str
    higher_is_better: bool
    kind: MetricKind
    """slider: 1–10; bucket: sleep_onset_bucket; count: night_wakes"""
    chart_candidate: bool
    """If True and kind==slider, may be used for the trend chart (1–10 scale)."""


# All keys the platform can persist today (see src/lib/cohortCheckinFields.ts).
METRIC_REGISTRY: dict[str, MetricDef] = {
    "sleep_quality": MetricDef(
        key="sleep_quality",
        label="Sleep quality",
        table_label="Sleep quality (1–10)",
        higher_is_better=True,
        kind="slider",
        chart_candidate=True,
    ),
    "energy": MetricDef(
        key="energy",
        label="Energy",
        table_label="Energy (1–10)",
        higher_is_better=True,
        kind="slider",
        chart_candidate=True,
    ),
    "mood": MetricDef(
        key="mood",
        label="Mood",
        table_label="Mood (1–10)",
        higher_is_better=True,
        kind="slider",
        chart_candidate=True,
    ),
    "focus": MetricDef(
        key="focus",
        label="Focus",
        table_label="Focus (1–10)",
        higher_is_better=True,
        kind="slider",
        chart_candidate=True,
    ),
    "mental_clarity": MetricDef(
        key="mental_clarity",
        label="Mental clarity",
        table_label="Mental clarity (1–10)",
        higher_is_better=True,
        kind="slider",
        chart_candidate=True,
    ),
    "calmness": MetricDef(
        key="calmness",
        label="Calmness",
        table_label="Calmness (1–10)",
        higher_is_better=True,
        kind="slider",
        chart_candidate=True,
    ),
    "sleep_onset_bucket": MetricDef(
        key="sleep_onset_bucket",
        label="Time to fall asleep",
        table_label="Time to fall asleep (bucket)",
        higher_is_better=False,
        kind="bucket",
        chart_candidate=False,
    ),
    "night_wakes": MetricDef(
        key="night_wakes",
        label="Night wakings",
        table_label="Times woken in the night",
        higher_is_better=False,
        kind="count",
        chart_candidate=False,
    ),
}


def resolve_metrics_for_cohort(checkin_fields: list[str]) -> list[MetricDef]:
    """Preserve cohort order; skip unknown keys."""
    out: list[MetricDef] = []
    seen: set[str] = set()
    for k in checkin_fields:
        key = str(k or "").strip()
        m = METRIC_REGISTRY.get(key)
        if m and key not in seen:
            seen.add(key)
            out.append(m)
    return out


def pick_primary_metric(defs: list[MetricDef]) -> MetricDef:
    """First chart-capable slider in cohort order, else first def."""
    for m in defs:
        if m.chart_candidate and m.kind == "slider":
            return m
    return defs[0]


def pick_chart_metric(defs: list[MetricDef], primary: MetricDef) -> MetricDef:
    """Trend chart needs a 1–10 slider."""
    if primary.chart_candidate and primary.kind == "slider":
        return primary
    for m in defs:
        if m.chart_candidate and m.kind == "slider":
            return m
    return primary
