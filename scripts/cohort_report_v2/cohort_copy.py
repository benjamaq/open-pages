"""
Small per-slug copy overrides. Everything else is generic layout + registry labels.
"""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CohortReportCopy:
    hero_template: str
    """{sign} {primary_pct_change} {primary_label} {product} {study_days} {brand}"""
    chart_section_title: str
    chart_blurb: str
    outcomes_section_title: str
    methodology_intro: str
    signal_strong_body: str
    signal_moderate_body: str
    signal_weak_body: str
    marketing_intro: str
    retail_deck_prefix: str
    claims_table_rows: list[tuple[str, str]]
    """(outcome label, maps-to-claim) for methodology page."""
    ad_left_kicker: str
    ad_left_headline: str
    ad_left_body: str
    ad_right_kicker: str
    ad_right_headline: str
    ad_right_body: str
    retail_body_template: str


def _fmt(template: str, ctx: dict[str, Any]) -> str:
    out = template
    for k, v in ctx.items():
        out = out.replace("{" + k + "}", str(v))
    return out


def get_cohort_copy(slug: str) -> CohortReportCopy:
    slug = str(slug or "").strip().lower()
    if slug == "donotage-suresleep":
        return CohortReportCopy(
            hero_template=(
                "Sleep quality improved {sign}{primary_pct_change}% across a<br/>"
                "{study_days}-day customer cohort."
            ),
            chart_section_title="SLEEP QUALITY OVER TIME",
            chart_blurb=(
                "Cohort average score (1–10) across completed participants. "
                "Baseline period (days 1–5) shown in grey. Confound days excluded."
            ),
            outcomes_section_title="PRIMARY OUTCOMES — {study_days}-Day Change vs Pre-Product Baseline",
            methodology_intro=(
                "Each BioStackr study is built around the specific claims a product makes. "
                "The outcomes below were chosen to directly measure what this product claims "
                "to do — not generic tracking metrics."
            ),
            signal_strong_body=(
                "High-confidence effect observed. Consistent improvement across the cohort "
                "with a {d_label} effect size (d = {d}) and {completion_rate}% completion rate."
            ),
            signal_moderate_body=(
                "Moderate effect observed across the cohort with a {d_label} effect size "
                "(d = {d}). {completion_rate}% of participants completed the full study."
            ),
            signal_weak_body=(
                "Directional effect observed (d = {d}). {completion_rate}% completion rate. "
                "A larger confirmed cohort would strengthen this signal."
            ),
            marketing_intro=(
                "Verified outputs derived directly from study results. All external claims "
                "remain subject to brand compliance review."
            ),
            retail_deck_prefix="Customer Study Results",
            claims_table_rows=[
                ("Sleep quality (1–10 scale)", '"Improves sleep quality and depth"'),
                ("Morning energy (1–10 scale)", '"Wake up feeling refreshed and energised"'),
                ("Time to fall asleep (bucketed)", '"Helps you fall asleep faster"'),
                ("Times woken in the night (count)", '"Reduces night-time wake-ups"'),
            ],
            ad_left_kicker="META / INSTAGRAM ADS",
            ad_left_headline="Better sleep in {days_str}.",
            ad_left_body=(
                "{pct_str} of participants reported improved sleep quality "
                "in a BioStackr customer cohort study. Verified outcomes."
            ),
            ad_right_kicker="LANDING PAGE",
            ad_right_headline="Your customers. {days_str}. Measurable results.",
            ad_right_body=(
                "{pct_str} of customers reported improved sleep quality "
                "in {days_str} — verified in a BioStackr customer cohort. Effect size: d = {d}."
            ),
            retail_body_template=(
                "<b>Customer Study Results</b><br/>"
                "{n} participants · {completion_pct}% completion · d = {d} · "
                "{pct_str} reported improved sleep quality over {days_str}."
            ),
        )
    if slug == "seeking-health-optimal-focus":
        return CohortReportCopy(
            hero_template=(
                "{primary_label} improved {sign}{primary_pct_change}% across a<br/>"
                "{study_days}-day customer cohort."
            ),
            chart_section_title="PRIMARY OUTCOME OVER TIME",
            chart_blurb=(
                "Cohort average score (1–10) for the primary outcome across completed participants. "
                "Baseline period (days 1–5) shown in grey. Confound days excluded."
            ),
            outcomes_section_title="PRIMARY OUTCOMES — {study_days}-Day Change vs Pre-Product Baseline",
            methodology_intro=(
                "Each BioStackr study is built around the specific claims a product makes. "
                "The outcomes below were chosen to directly measure what this product claims "
                "to do — not generic tracking metrics."
            ),
            signal_strong_body=(
                "High-confidence effect observed on the primary outcome with a {d_label} effect size "
                "(d = {d}) and {completion_rate}% completion rate."
            ),
            signal_moderate_body=(
                "Moderate effect observed with a {d_label} effect size (d = {d}). "
                "{completion_rate}% of participants completed the full study."
            ),
            signal_weak_body=(
                "Directional effect observed (d = {d}). {completion_rate}% completion rate. "
                "A larger confirmed cohort would strengthen this signal."
            ),
            marketing_intro=(
                "Verified outputs derived directly from study results. All external claims "
                "remain subject to brand compliance review."
            ),
            retail_deck_prefix="Customer Study Results",
            claims_table_rows=[
                ("Focus (1–10 scale)", '"Supports focus and concentration"'),
                ("Mental energy / alertness (1–10 scale)", '"Sustains mental energy through the day"'),
                ("Mental clarity (1–10 scale)", '"Clearer, sharper thinking"'),
            ],
            ad_left_kicker="META / INSTAGRAM ADS",
            ad_left_headline="Measurable cognitive outcomes in {days_str}.",
            ad_left_body=(
                "{pct_str} of participants showed improvement on the primary outcome "
                "in a BioStackr customer cohort study. Verified results."
            ),
            ad_right_kicker="LANDING PAGE",
            ad_right_headline="Real customers. {days_str}. Data-backed clarity.",
            ad_right_body=(
                "{pct_str} improved on the primary tracked outcome in {days_str} — "
                "BioStackr cohort methodology. Effect size: d = {d}."
            ),
            retail_body_template=(
                "<b>Customer Study Results</b><br/>"
                "{n} participants · {completion_pct}% completion · d = {d} · "
                "{pct_str} improved on primary outcome over {days_str}."
            ),
        )
    # Generic fallback (third cohorts, placeholders)
    return CohortReportCopy(
        hero_template=(
            "{primary_label} changed {sign}{primary_pct_change}% across a<br/>"
            "{study_days}-day customer cohort (vs pre-product baseline)."
        ),
        chart_section_title="PRIMARY OUTCOME OVER TIME",
        chart_blurb=(
            "Cohort average score (1–10) where applicable. "
            "Baseline period (days 1–5) shown in grey. Confound days excluded."
        ),
        outcomes_section_title="OUTCOMES — {study_days}-Day Change vs Pre-Product Baseline",
        methodology_intro=(
            "This report compares each participant’s early study window to their late study window "
            "after confound-tagged days are removed."
        ),
        signal_strong_body=(
            "High-confidence effect on the primary outcome with a {d_label} effect size "
            "(d = {d}) and {completion_rate}% completion rate."
        ),
        signal_moderate_body=(
            "Moderate effect with a {d_label} effect size (d = {d}). "
            "{completion_rate}% of participants completed the full study."
        ),
        signal_weak_body=(
            "Directional effect (d = {d}). {completion_rate}% completion rate. "
            "A larger cohort would strengthen this signal."
        ),
        marketing_intro="Verified outputs derived from study data. Subject to compliance review.",
        retail_deck_prefix="Cohort Study Results",
        claims_table_rows=[],
        ad_left_kicker="META / INSTAGRAM ADS",
        ad_left_headline="Measured outcomes in {days_str}.",
        ad_left_body=(
            "{pct_str} of participants improved on the primary outcome in a "
            "BioStackr cohort study."
        ),
        ad_right_kicker="LANDING PAGE",
        ad_right_headline="Customer cohort. {days_str}. Verified metrics.",
        ad_right_body=(
            "{pct_str} improved on the primary outcome in {days_str} (d = {d})."
        ),
        retail_body_template=(
            "<b>Cohort Study Results</b><br/>"
            "{n} participants · {completion_pct}% completion · d = {d} · "
            "{pct_str} improved on primary outcome over {days_str}."
        ),
    )


def format_copy(template: str, **kwargs: Any) -> str:
    return _fmt(template, kwargs)
