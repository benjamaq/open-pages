"""Baseline vs final stats: Cohen's d, bootstrap CI, % improved — cohort-agnostic."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

import numpy as np

from .registry import MetricDef


def cohens_d(before: list[float], after: list[float]) -> float:
    """Paired Cohen's d: mean(baseline→final difference) / SD of those differences.

    Returns 0.0 when n < 2, lengths mismatch, or SD is zero / non-finite (constant diffs,
    tiny-n degeneracy) so report generation never emits inf or NumPy divide warnings.
    """
    b = np.asarray(before, dtype=float)
    a = np.asarray(after, dtype=float)
    if b.ndim != 1 or a.ndim != 1 or b.shape != a.shape or b.size < 2:
        return 0.0
    diffs = a - b
    std_d = float(np.std(diffs, ddof=1))
    if not np.isfinite(std_d) or std_d < 1e-12:
        return 0.0
    mean_d = float(np.mean(diffs))
    d = mean_d / std_d
    if not np.isfinite(d):
        return 0.0
    return float(d)


def bootstrap_ci(before: list[float], after: list[float], n_boot: int = 1000, ci: int = 95) -> tuple[float, float]:
    diffs = np.array(after) - np.array(before)
    if len(diffs) < 2:
        return (0.0, 0.0)
    boot_means: list[float] = []
    rng = np.random.default_rng(42)
    for _ in range(n_boot):
        sample = rng.choice(diffs, size=len(diffs), replace=True)
        boot_means.append(float(np.mean(sample)))
    lo = float(np.percentile(boot_means, (100 - ci) / 2))
    hi = float(np.percentile(boot_means, 100 - (100 - ci) / 2))
    return (round(lo, 2), round(hi, 2))


def classify_d(d: float) -> str:
    ad = abs(d)
    if ad >= 0.8:
        return "large"
    if ad >= 0.5:
        return "moderate-large"
    if ad >= 0.3:
        return "moderate"
    return "small"


def signal_classification(d: float, pct_improved: float, n: int) -> tuple[str, str]:
    """Returns (label, colour hex without # for ReportLab)."""
    if abs(d) >= 0.5 and pct_improved >= 60 and n >= 15:
        return ("STRONG SIGNAL", "#3B6D11")
    if abs(d) >= 0.3 and pct_improved >= 50 and n >= 10:
        return ("MODERATE SIGNAL", "#BA7517")
    return ("WEAK SIGNAL", "#777777")


CONFOUND_TAGS = frozenset({"illness", "alcohol", "high_stress", "travel", "poor_sleep"})
MIN_CHECKINS = 15


def analyse_cohort(
    participants: list[dict[str, Any]],
    entries: list[dict[str, Any]],
    metric_defs: list[MetricDef],
    baseline_days: int = 5,
    final_days: int = 5,
) -> tuple[dict[str, dict[str, Any]], int]:
    user_entries: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for e in entries:
        user_entries[str(e["user_id"])].append(e)

    for uid in user_entries:
        user_entries[uid].sort(key=lambda x: str(x.get("local_date", "")))

    results: dict[str, dict[str, list[float]]] = {
        m.key: {"baseline": [], "final": []} for m in metric_defs
    }

    completed_participants = 0

    for _uid, entries_list in user_entries.items():
        clean = [e for e in entries_list if not any(t in CONFOUND_TAGS for t in (e.get("tags") or []))]
        if len(clean) < MIN_CHECKINS:
            continue

        completed_participants += 1
        baseline = clean[:baseline_days]
        final = clean[-final_days:]

        for m in metric_defs:
            key = m.key
            b_vals = [e[key] for e in baseline if e.get(key) is not None]
            f_vals = [e[key] for e in final if e.get(key) is not None]
            if not b_vals or not f_vals:
                continue
            results[key]["baseline"].append(float(np.mean(b_vals)))
            results[key]["final"].append(float(np.mean(f_vals)))

    stats: dict[str, dict[str, Any]] = {}
    for m in metric_defs:
        key = m.key
        data = results[key]
        b = np.array(data["baseline"])
        f = np.array(data["final"])
        if len(b) < 2:
            continue

        n = len(b)
        mean_b = round(float(np.mean(b)), 1)
        mean_f = round(float(np.mean(f)), 1)
        change = round(mean_f - mean_b, 1)
        pct_change = round((change / mean_b) * 100) if mean_b != 0 else 0

        if m.higher_is_better:
            improved = int(np.sum(f > b))
        else:
            improved = int(np.sum(f < b))

        pct_improved = round((improved / n) * 100)

        d = cohens_d(list(b), list(f))
        if not m.higher_is_better:
            d = -d
        d = round(float(d), 2)

        ci_lo, ci_hi = bootstrap_ci(list(b), list(f))
        if not m.higher_is_better:
            ci_lo, ci_hi = -ci_hi, -ci_lo

        stats[key] = {
            "n": n,
            "baseline": mean_b,
            "final": mean_f,
            "change": change,
            "pct_change": pct_change,
            "pct_improved": pct_improved,
            "d": d,
            "d_label": classify_d(d),
            "ci": (ci_lo, ci_hi),
            "improved": improved,
            "def": m,
        }

    return stats, completed_participants
