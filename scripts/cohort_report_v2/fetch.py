"""Supabase REST fetch: cohort row, confirmed participants, daily_entries."""

from __future__ import annotations

import os
import sys
from typing import Any

from .registry import MetricDef


def rest_get(url: str, key: str, table: str, params: dict[str, str]) -> list[Any]:
    import requests as req

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    r = req.get(f"{url}/rest/v1/{table}", headers=headers, params=params, timeout=120)
    r.raise_for_status()
    return r.json()


def parse_checkin_fields(raw: Any) -> list[str]:
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if str(x).strip()]
    return []


def fetch_cohort_row(cohort_slug: str) -> dict[str, Any]:
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    print(f"Fetching cohort: {cohort_slug}")
    cohorts = rest_get(url, key, "cohorts", {"slug": f"eq.{cohort_slug}", "select": "*"})
    if not cohorts:
        print("ERROR: Cohort not found")
        sys.exit(1)
    cohort = cohorts[0]
    print(f"Cohort: {cohort.get('product_name')} by {cohort.get('brand_name')}")
    return cohort


def fetch_participants_and_entries(
    cohort: dict[str, Any],
    metric_defs: list[MetricDef],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    participants = rest_get(
        url,
        key,
        "cohort_participants",
        {
            "cohort_id": f"eq.{cohort['id']}",
            "status": "eq.confirmed",
            "select": "user_id,enrolled_at,confirmed_at",
        },
    )
    print(f"Confirmed participants: {len(participants)}")
    if not participants:
        print("ERROR: No confirmed participants")
        sys.exit(1)

    auth_ids = [p["user_id"] for p in participants]
    uid_list = "(" + ",".join(auth_ids) + ")"

    base_cols = ["user_id", "local_date", "tags", "created_at"]
    metric_cols = [m.key for m in metric_defs]
    select_cols = ",".join(base_cols + metric_cols)

    entries = rest_get(
        url,
        key,
        "daily_entries",
        {
            "user_id": f"in.{uid_list}",
            "select": select_cols,
            "limit": "10000",
        },
    )
    print(f"Total entries: {len(entries)}")
    return participants, entries
