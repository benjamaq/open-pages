"""Single generic PDF layout: dynamic metrics, cohort copy block."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

import numpy as np
from reportlab.graphics.shapes import Drawing, Line, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .cohort_copy import CohortReportCopy, format_copy
from .registry import MetricDef
from .stats_engine import signal_classification

C_RUST = colors.HexColor("#C84B2F")
C_DARK = colors.HexColor("#1A1A1A")
C_MID = colors.HexColor("#444444")
C_LIGHT = colors.HexColor("#777777")
C_RULE = colors.HexColor("#E8E0D8")
C_PALE = colors.HexColor("#FAF7F4")
C_GREEN = colors.HexColor("#3B6D11")
C_AMBER = colors.HexColor("#BA7517")

W, H = A4
ML, MR = 22 * mm, 22 * mm
MT, MB = 20 * mm, 20 * mm
CW = W - ML - MR


def sp(n: float) -> Spacer:
    return Spacer(1, n * mm)


LABEL = ParagraphStyle(
    "lbl", fontName="Helvetica-Bold", fontSize=7, textColor=C_RUST, leading=10, tracking=80
)
HERO = ParagraphStyle("hero", fontName="Helvetica-Bold", fontSize=28, textColor=C_DARK, leading=34)
HERO_SUB = ParagraphStyle("hsub", fontName="Helvetica", fontSize=12, textColor=C_MID, leading=17)
BODY = ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, textColor=C_MID, leading=15)
BODY_B = ParagraphStyle("bb", fontName="Helvetica-Bold", fontSize=9.5, textColor=C_DARK, leading=15)
SMALL = ParagraphStyle("sm", fontName="Helvetica", fontSize=8, textColor=C_LIGHT, leading=12)
FOOTER = ParagraphStyle("ft", fontName="Helvetica", fontSize=7.5, textColor=C_LIGHT, leading=10, alignment=TA_CENTER)
STAT_NUM = ParagraphStyle(
    "stn", fontName="Helvetica-Bold", fontSize=22, textColor=C_RUST, leading=26, alignment=TA_CENTER
)
STAT_LBL = ParagraphStyle(
    "stl", fontName="Helvetica", fontSize=9, textColor=C_LIGHT, leading=12, alignment=TA_CENTER
)


def rule():
    return HRFlowable(width="100%", thickness=0.5, color=C_RULE, spaceAfter=0, spaceBefore=0)


def block_quote(text: str) -> Table:
    tbl = Table([[Paragraph(text, BODY)]], colWidths=[CW - 8 * mm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), C_PALE),
                ("LINEBEFORE", (0, 0), (0, 0), 3, C_RUST),
                ("LEFTPADDING", (0, 0), (0, 0), 10),
                ("RIGHTPADDING", (0, 0), (0, 0), 10),
                ("TOPPADDING", (0, 0), (0, 0), 8),
                ("BOTTOMPADDING", (0, 0), (0, 0), 8),
            ]
        )
    )
    return tbl


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(C_RULE)
    canvas.setLineWidth(0.5)
    canvas.line(ML, H - 14 * mm, W - MR, H - 14 * mm)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.setFillColor(C_DARK)
    canvas.drawString(ML, H - 11 * mm, "BIOSTACK")
    canvas.setFont("Helvetica-Bold", 11)
    canvas.setFillColor(C_RUST)
    canvas.drawString(ML + 58, H - 11 * mm, "R")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(C_LIGHT)
    rh = getattr(doc, "_right_header", "BioStackr Cohort Study Report · Confidential")
    canvas.drawRightString(W - MR, H - 11 * mm, rh)
    canvas.line(ML, 14 * mm, W - MR, 14 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(ML, 10 * mm, "BioStackr · biostackr.io · Confidential")
    canvas.drawRightString(W - MR, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_trend_chart(
    user_entries: dict[str, list[dict[str, Any]]],
    metric_key: str,
    width: float = CW,
    height: float = 40 * mm,
) -> Drawing | None:
    day_scores: dict[int, list[float]] = defaultdict(list)
    for _uid, entries_list in user_entries.items():
        for e in entries_list:
            val = e.get(metric_key)
            if val is not None:
                day_num = entries_list.index(e) + 1
                day_scores[day_num].append(float(val))

    days = sorted(day_scores.keys())
    if not days:
        return None

    means = [float(np.mean(day_scores[d])) for d in days]
    min_v, max_v = 1, 10
    pad_x = 8 * mm
    pad_y = 6 * mm
    chart_w = width - 2 * pad_x
    chart_h = height - 2 * pad_y
    max_day = max(days)

    dwg = Drawing(width, height)
    baseline_x = pad_x + (3 / max_day) * chart_w
    baseline_rect = Rect(
        pad_x, pad_y, baseline_x - pad_x, chart_h, fillColor=colors.HexColor("#F5F2EE"), strokeColor=None
    )
    dwg.add(baseline_rect)

    for v in [3, 5, 7, 9]:
        y = pad_y + ((v - min_v) / (max_v - min_v)) * chart_h
        dwg.add(
            Line(pad_x, y, pad_x + chart_w, y, strokeColor=colors.HexColor("#EEEBE6"), strokeWidth=0.3)
        )

    points: list[tuple[float, float]] = []
    for i, day in enumerate(days):
        x = pad_x + ((day - 1) / max(max_day - 1, 1)) * chart_w
        y = pad_y + ((means[i] - min_v) / (max_v - min_v)) * chart_h
        points.append((x, y))

    for i in range(len(points) - 1):
        dwg.add(
            Line(
                points[i][0],
                points[i][1],
                points[i + 1][0],
                points[i + 1][1],
                strokeColor=C_RUST,
                strokeWidth=1.5,
            )
        )

    if points:
        dwg.add(
            String(
                points[0][0],
                points[0][1] + 3,
                str(round(means[0], 1)),
                fontName="Helvetica-Bold",
                fontSize=8,
                fillColor=C_DARK,
            )
        )
        dwg.add(
            String(
                points[-1][0] - 8,
                points[-1][1] + 3,
                str(round(means[-1], 1)),
                fontName="Helvetica-Bold",
                fontSize=8,
                fillColor=C_RUST,
            )
        )

    if len(days) > 7:
        onset_day = 7
        ox = pad_x + ((onset_day - 1) / max(max_day - 1, 1)) * chart_w
        dwg.add(
            Line(ox, pad_y, ox, pad_y + chart_h, strokeColor=C_RUST, strokeWidth=0.5, strokeDashArray=[2, 2])
        )
        dwg.add(
            String(
                ox + 2,
                pad_y + chart_h * 0.3,
                f"Day {onset_day}: reference",
                fontName="Helvetica",
                fontSize=7,
                fillColor=C_RUST,
            )
        )

    return dwg


def stat_card_row(stats_list: list[tuple[str, str, str | None]]) -> Table:
    cells = []
    for label, value, sublabel in stats_list:
        cell = [Paragraph(value, STAT_NUM), Spacer(1, 2), Paragraph(label, STAT_LBL)]
        if sublabel:
            cell.append(Paragraph(sublabel, SMALL))
        cells.append(cell)

    ncols = len(stats_list)
    tbl = Table([cells], colWidths=[CW / ncols] * ncols)
    tbl.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEAFTER", (0, 0), (-2, -1), 0.5, C_RULE),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return tbl


def outcomes_table(stats: dict[str, dict[str, Any]], metric_order: list[MetricDef]) -> Table:
    header = [
        Paragraph("Metric", BODY_B),
        Paragraph("Baseline", BODY_B),
        Paragraph("Final window", BODY_B),
        Paragraph("Change", BODY_B),
        Paragraph("% Improved", BODY_B),
        Paragraph("Cohen's d", BODY_B),
        Paragraph("95% CI", BODY_B),
    ]
    rows: list[list[Paragraph]] = [header]

    for m in metric_order:
        if m.key not in stats:
            continue
        s = stats[m.key]
        sign = "+" if s["change"] >= 0 else ""
        if m.kind == "slider":
            change_str = f"{sign}{s['change']} pts"
        else:
            change_str = f"{sign}{s['pct_change']}% (mean shift)"

        row = [
            Paragraph(f"<b>{m.table_label}</b>", BODY),
            Paragraph(str(s["baseline"]), BODY),
            Paragraph(f"<font color='#C84B2F'><b>{s['final']}</b></font>", BODY),
            Paragraph(change_str, BODY),
            Paragraph(f"{s['pct_improved']}%", BODY),
            Paragraph(
                f"{s['d']}<br/><font size=7 color='#777'>({s['d_label']})</font>",
                BODY,
            ),
            Paragraph(f"{s['ci'][0]} to {s['ci'][1]}", SMALL),
        ]
        rows.append(row)

    col_widths = [CW * 0.28, CW * 0.10, CW * 0.10, CW * 0.10, CW * 0.12, CW * 0.16, CW * 0.14]
    tbl = Table(rows, colWidths=col_widths)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), C_RUST),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, C_PALE]),
                ("GRID", (0, 0), (-1, -1), 0.3, C_RULE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def build_pdf(
    cohort: dict[str, Any],
    participants: list[dict[str, Any]],
    entries: list[dict[str, Any]],
    stats: dict[str, dict[str, Any]],
    completed: int,
    metric_defs: list[MetricDef],
    primary: MetricDef,
    chart_metric: MetricDef,
    copy: CohortReportCopy,
    out_path: str,
) -> str:
    brand = str(cohort.get("brand_name") or "")
    product = str(cohort.get("product_name") or "")
    study_days = int(cohort.get("study_days") or 21)
    today = datetime.now().strftime("%B %Y")

    if primary.key not in stats:
        raise SystemExit(f"No stats for primary metric {primary.key}. Check data / checkin_fields.")

    pstat = stats[primary.key]
    sig_label, sig_hex = signal_classification(pstat["d"], pstat["pct_improved"], completed)
    signal_colour = colors.HexColor("#" + sig_hex.lstrip("#"))

    completion_rate = round((completed / len(participants)) * 100) if participants else 0
    pct = pstat["pct_change"]
    sign = "+" if pct >= 0 else ""

    hero_ctx = {
        "sign": sign,
        "primary_pct_change": str(pct),
        "primary_label": primary.label,
        "product": product,
        "study_days": str(study_days),
        "brand": brand,
    }
    hero_html = format_copy(copy.hero_template, **hero_ctx)

    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=ML,
        rightMargin=MR,
        topMargin=22 * mm,
        bottomMargin=22 * mm,
    )
    doc._right_header = f"{product} · Study Design & Methodology"

    story: list[Any] = []
    story.append(sp(1.5))
    story.append(
        Paragraph(
            product,
            ParagraphStyle("prod", fontName="Helvetica-Bold", fontSize=26, textColor=C_DARK, leading=30),
        )
    )
    story.append(
        Paragraph(
            f"Customer Cohort Study · {brand} · {completed} completed participants · {study_days} days · {today}",
            ParagraphStyle("meta", fontName="Helvetica", fontSize=10, textColor=C_LIGHT, leading=14),
        )
    )
    story.append(sp(0.5))
    story.append(Paragraph("STUDY RESULT", LABEL))
    story.append(sp(0.4))
    story.append(Paragraph(hero_html, HERO))
    story.append(sp(0.8))

    cards: list[tuple[str, str, str | None]] = [
        (
            f"Improved {primary.label.lower()}",
            f"{pstat['pct_improved']}%",
            None,
        ),
        (
            f"{primary.label} (% vs baseline)",
            f"{sign}{pct}%",
            None,
        ),
    ]
    other_keys = [m.key for m in metric_defs if m.key != primary.key and m.key in stats]
    for ok in other_keys[:2]:
        st = stats[ok]
        mdef = next(x for x in metric_defs if x.key == ok)
        cards.append(
            (
                f"{mdef.label} (% vs baseline)",
                f"{'+' if st['pct_change'] >= 0 else ''}{st['pct_change']}%",
                None,
            )
        )
    while len(cards) < 4:
        cards.append(("—", "—", None))

    story.append(stat_card_row(cards[:4]))
    story.append(sp(1))

    story.append(Paragraph(copy.chart_section_title, LABEL))
    story.append(Paragraph(copy.chart_blurb, SMALL))
    story.append(sp(0.3))

    user_entries: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for e in entries:
        user_entries[str(e["user_id"])].append(e)
    for uid in user_entries:
        user_entries[uid].sort(key=lambda x: str(x.get("local_date", "")))

    chart = build_trend_chart(user_entries, chart_metric.key)
    if chart:
        story.append(chart)
    story.append(sp(1))

    sig_tbl = Table(
        [
            [
                Paragraph(
                    f"Signal Classification → <font color='#{sig_hex.lstrip('#')}'><b>{sig_label}</b></font>",
                    BODY_B,
                )
            ]
        ],
        colWidths=[CW],
    )
    sig_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), C_PALE),
                ("LINEBEFORE", (0, 0), (0, 0), 3, signal_colour),
                ("LEFTPADDING", (0, 0), (0, 0), 10),
                ("TOPPADDING", (0, 0), (0, 0), 8),
                ("BOTTOMPADDING", (0, 0), (0, 0), 4),
            ]
        )
    )
    story.append(sig_tbl)

    sig_ctx = {
        "d_label": pstat["d_label"],
        "d": pstat["d"],
        "completion_rate": str(completion_rate),
    }
    if sig_label == "STRONG SIGNAL":
        sig_body_text = format_copy(copy.signal_strong_body, **sig_ctx)
    elif sig_label == "MODERATE SIGNAL":
        sig_body_text = format_copy(copy.signal_moderate_body, **sig_ctx)
    else:
        sig_body_text = format_copy(copy.signal_weak_body, **sig_ctx)

    sig_body = Table([[Paragraph(sig_body_text, BODY)]], colWidths=[CW])
    sig_body.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), C_PALE),
                ("LINEBEFORE", (0, 0), (0, 0), 3, signal_colour),
                ("LEFTPADDING", (0, 0), (0, 0), 10),
                ("RIGHTPADDING", (0, 0), (0, 0), 10),
                ("TOPPADDING", (0, 0), (0, 0), 4),
                ("BOTTOMPADDING", (0, 0), (0, 0), 8),
            ]
        )
    )
    story.append(sig_body)
    story.append(sp(1))

    out_title = format_copy(copy.outcomes_section_title, study_days=str(study_days))
    story.append(Paragraph(out_title, BODY))
    story.append(sp(0.4))
    story.append(outcomes_table(stats, metric_defs))
    story.append(sp(0.5))
    story.append(
        Paragraph(
            "Confidence intervals via 1,000 bootstrap resamples. Confound days self-tagged "
            "by participants and excluded from primary analysis. For1–10 scales, change % is "
            "relative to baseline mean; bucket/count metrics show directional improvement via Cohen's d.",
            SMALL,
        )
    )

    story.append(PageBreak())
    story.append(sp(1))
    story.append(
        Paragraph(
            "Study Design & Methodology",
            ParagraphStyle("p2h", fontName="Helvetica-Bold", fontSize=20, textColor=C_DARK, leading=24),
        )
    )
    story.append(sp(1))
    story.append(Paragraph("STUDY DESIGN — CONFIGURED FOR THIS PRODUCT", LABEL))
    story.append(sp(0.4))
    story.append(Paragraph(copy.methodology_intro, BODY))
    story.append(sp(0.6))

    claims_header = [
        Paragraph(
            "Outcome tracked",
            ParagraphStyle("ch", fontName="Helvetica-Bold", fontSize=9, textColor=colors.white, leading=12),
        ),
        Paragraph(
            "Maps to product positioning",
            ParagraphStyle("ch2", fontName="Helvetica-Bold", fontSize=9, textColor=colors.white, leading=12),
        ),
    ]
    claims_data: list[list[Paragraph]] = [claims_header]
    if copy.claims_table_rows:
        for out_l, claim in copy.claims_table_rows:
            claims_data.append([Paragraph(out_l, BODY), Paragraph(claim, BODY)])
    else:
        for m in metric_defs:
            claims_data.append(
                [
                    Paragraph(m.table_label, BODY),
                    Paragraph(f"Tracked outcome: {m.label}", BODY),
                ]
            )

    claims_tbl = Table(claims_data, colWidths=[CW * 0.5, CW * 0.5])
    claims_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), C_RUST),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, C_PALE]),
                ("GRID", (0, 0), (-1, -1), 0.3, C_RULE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(claims_tbl)
    story.append(sp(1))
    story.append(Paragraph("METHODOLOGY", LABEL))
    story.append(sp(0.5))

    method_data = [
        (
            "Study design",
            "Within-subject cohort. Each participant compared against their own pre-product baseline.",
        ),
        (
            "Data collection",
            f"Daily check-ins on the outcomes configured for this cohort ({len(metric_defs)} fields).",
        ),
        (
            "Analysis",
            "Cohen's d effect sizes with bootstrap confidence intervals (1,000 resamples). "
            "Confound days self-tagged and excluded from primary analysis.",
        ),
        ("Baseline period", "Days 1–5: early window before late-window comparison."),
        (
            "Primary comparison",
            "Final window vs baseline window (default: last 5 vs first 5 clean check-ins per participant).",
        ),
    ]
    for label, val in method_data:
        row_tbl = Table([[Paragraph(label, BODY_B), Paragraph(val, BODY)]], colWidths=[40 * mm, CW - 40 * mm])
        row_tbl.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.3, C_RULE),
                ]
            )
        )
        story.append(row_tbl)

    story.append(sp(0.8))
    story.append(Paragraph("REAL-WORLD RESILIENCE", LABEL))
    story.append(sp(0.4))
    story.append(
        block_quote(
            "Confound days — illness, travel, alcohol, stress — were self-tagged and excluded "
            "from primary analysis. "
            f"Primary outcome ({primary.label}) mean change: {sign}{round(pstat['change'], 1)} points."
        )
    )

    story.append(PageBreak())
    story.append(sp(1))
    story.append(
        Paragraph(
            "Marketing Applications",
            ParagraphStyle("p3h", fontName="Helvetica-Bold", fontSize=20, textColor=C_DARK, leading=24),
        )
    )
    story.append(sp(0.3))
    story.append(Paragraph(copy.marketing_intro, SMALL))
    story.append(sp(1))

    pct_str = f"{pstat['pct_improved']}%"
    days_str = f"{study_days} days"
    ad_ctx = {
        "pct_str": pct_str,
        "days_str": days_str,
        "d": str(pstat["d"]),
    }

    ad_left = [
        Paragraph(copy.ad_left_kicker, LABEL),
        sp(0.3),
        Paragraph(format_copy(copy.ad_left_headline, **ad_ctx), BODY_B),
        sp(0.3),
        Paragraph(format_copy(copy.ad_left_body, **ad_ctx), BODY),
    ]
    ad_right = [
        Paragraph(copy.ad_right_kicker, LABEL),
        sp(0.3),
        Paragraph(format_copy(copy.ad_right_headline, **ad_ctx), BODY_B),
        sp(0.3),
        Paragraph(format_copy(copy.ad_right_body, **ad_ctx), BODY),
    ]
    ad_tbl = Table([[ad_left, ad_right]], colWidths=[CW / 2 - 3 * mm, CW / 2 - 3 * mm], hAlign="LEFT")
    ad_tbl.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), C_PALE),
                ("LINEBEFORE", (0, 0), (0, -1), 2, C_RUST),
                ("LINEBEFORE", (1, 0), (1, -1), 2, C_RUST),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (0, -1), 6),
                ("LEFTPADDING", (1, 0), (1, -1), 6),
            ]
        )
    )
    story.append(ad_tbl)
    story.append(sp(0.8))

    retail_ctx = {
        "n": str(completed),
        "completion_pct": str(completion_rate),
        "d": str(pstat["d"]),
        "pct_str": pct_str,
        "days_str": days_str,
    }
    retail_tbl = Table(
        [
            [
                Paragraph(copy.retail_deck_prefix, LABEL),
                Paragraph(format_copy(copy.retail_body_template, **retail_ctx), BODY),
            ]
        ],
        colWidths=[35 * mm, CW - 35 * mm],
    )
    retail_tbl.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, C_RULE),
            ]
        )
    )
    story.append(retail_tbl)
    story.append(sp(1))

    story.append(
        Paragraph(
            "Commercial Impact",
            ParagraphStyle("ci", fontName="Helvetica-Bold", fontSize=14, textColor=C_DARK, leading=18),
        )
    )
    story.append(sp(0.5))
    impact_data = [
        (
            "Stronger ad performance",
            "Verified stats consistently outperform generic marketing copy. "
            "A specific number gives paid ads a concrete, credible hook.",
        ),
        (
            "Higher conversion",
            "Third-party verified customer data builds purchase confidence at the point of decision.",
        ),
        (
            "Retail credibility",
            "A completed cohort study differentiates a brand in buyer conversations and retail pitches.",
        ),
    ]
    for lbl, val in impact_data:
        row_tbl = Table([[Paragraph(lbl, BODY_B), Paragraph(val, BODY)]], colWidths=[48 * mm, CW - 48 * mm])
        row_tbl.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.3, C_RULE),
                ]
            )
        )
        story.append(row_tbl)

    story.append(sp(0.8))
    story.append(
        block_quote(
            f"This study positions {product} with measurable, real-customer evidence. "
            f"The data supports premium positioning, buyer conversations, and paid media with credibility "
            f"that brands without study data cannot match."
        )
    )

    story.append(sp(1.5))
    story.append(rule())
    story.append(sp(0.5))
    story.append(
        Paragraph(
            f"BioStackr · biostackr.io · {product} Customer Cohort Study · Confidential · Prepared for {brand}",
            FOOTER,
        )
    )

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"\nReport generated: {out_path}")
    return out_path
