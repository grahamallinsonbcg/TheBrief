from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

STREAM_LABELS = {
    "model-releases": "Model Releases & Benchmarks",
    "research-papers": "Research Papers",
    "ai-tools-products": "AI Tools & Products",
    "scaled-ai-use-cases": "Case Studies",
    "context-data-prep": "Context & Data Preparation for AI",
}


def build_edition(
    *,
    slug: str,
    day: str,
    processed: dict[str, Any],
    run_date: str | None = None,
) -> dict[str, Any]:
    """Build final edition JSON shape consumed by the frontend."""
    date_value = run_date or datetime.now(timezone.utc).date().isoformat()
    edition_type = "weekly-wrap" if day == "sun" else "edition"

    items: list[dict[str, Any]] = processed.get("items", [])
    stream_commentary: dict[str, str] = processed.get("stream_commentary", {})
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for item in items:
        grouped[item["stream_tag"]].append(
            {
                "id": item["id"],
                "title": item["title"],
                "url": item["url"],
                "source": item["source"],
                "date": item["date"],
                "summary": item["summary"],
                "signal_score": item.get("signal_score", 0.5),
            }
        )

    streams: dict[str, Any] = {}
    for stream_tag, label in STREAM_LABELS.items():
        if stream_tag not in grouped:
            continue
        streams[stream_tag] = {
            "name": label,
            "commentary": stream_commentary.get(stream_tag, ""),
            "items": grouped[stream_tag],
        }

    edition: dict[str, Any] = {
        "slug": slug,
        "date": date_value,
        "type": edition_type,
        "streams": streams,
    }

    if edition_type == "weekly-wrap":
        edition["synthesis"] = processed.get("weekly_synthesis", "")

    return edition
