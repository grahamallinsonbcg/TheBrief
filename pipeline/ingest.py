from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import feedparser
import yaml

try:
    from firecrawl import FirecrawlApp
except ImportError:  # pragma: no cover
    FirecrawlApp = None


@dataclass
class Source:
    name: str
    tier: str
    url: str
    streams: list[str]


def _load_yaml(path: str) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as file:
        return yaml.safe_load(file) or {}


def _to_iso_date(value: str | None) -> str:
    if not value:
        return datetime.now(timezone.utc).date().isoformat()
    try:
        parsed = parsedate_to_datetime(value)
        return parsed.date().isoformat()
    except (TypeError, ValueError):
        return datetime.now(timezone.utc).date().isoformat()


def _normalize_item(
    *, title: str, url: str, source: str, date: str, raw_text: str, streams: list[str]
) -> dict[str, Any]:
    url_hash = hashlib.sha256(url.strip().encode("utf-8")).hexdigest()
    return {
        "id": url_hash,
        "title": title.strip(),
        "url": url.strip(),
        "source": source.strip(),
        "date": date,
        "raw_text": raw_text.strip(),
        "streams": streams,
    }


def _ingest_rss_source(source: Source) -> list[dict[str, Any]]:
    parsed = feedparser.parse(source.url)
    items: list[dict[str, Any]] = []
    for entry in parsed.entries[:25]:
        link = entry.get("link", "").strip()
        title = entry.get("title", "").strip()
        if not link or not title:
            continue

        raw_text = entry.get("summary", "") or entry.get("description", "") or title
        published = entry.get("published") or entry.get("updated")
        items.append(
            _normalize_item(
                title=title,
                url=link,
                source=source.name,
                date=_to_iso_date(published),
                raw_text=raw_text,
                streams=source.streams,
            )
        )
    return items


def _ingest_scrape_source(source: Source, firecrawl_api_key: str | None) -> list[dict[str, Any]]:
    if not firecrawl_api_key or FirecrawlApp is None:
        return []

    app = FirecrawlApp(api_key=firecrawl_api_key)
    response = app.scrape_url(source.url, formats=["markdown"])
    markdown = ""
    if isinstance(response, dict):
        markdown = response.get("markdown", "") or ""
    if not markdown:
        return []

    title = source.name
    return [
        _normalize_item(
            title=title,
            url=source.url,
            source=source.name,
            date=datetime.now(timezone.utc).date().isoformat(),
            raw_text=markdown[:8000],
            streams=source.streams,
        )
    ]


def _ingest_manual_items(path: str) -> list[dict[str, Any]]:
    data = _load_yaml(path)
    items = data.get("items", [])
    normalized: list[dict[str, Any]] = []
    for item in items:
        url = (item.get("url") or "").strip()
        title = (item.get("title") or "").strip()
        if not url or not title:
            continue

        normalized.append(
            _normalize_item(
                title=title,
                url=url,
                source=(item.get("source") or "Manual").strip(),
                date=(item.get("date") or datetime.now(timezone.utc).date().isoformat()).strip(),
                raw_text=(item.get("raw_text") or title).strip(),
                streams=item.get("streams") or [],
            )
        )
    return normalized


def ingest_items(
    sources_path: str = "pipeline/config/sources.yaml",
    manual_picks_path: str = "pipeline/config/manual_picks.yaml",
) -> list[dict[str, Any]]:
    """Ingest and normalize items from RSS, scrape, and manual picks."""
    config = _load_yaml(sources_path)
    source_objects = [Source(**source) for source in config.get("sources", [])]

    firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
    combined: list[dict[str, Any]] = []

    for source in source_objects:
        if source.tier == "rss":
            combined.extend(_ingest_rss_source(source))
        elif source.tier == "scrape":
            combined.extend(_ingest_scrape_source(source, firecrawl_api_key))

    combined.extend(_ingest_manual_items(manual_picks_path))

    # Deduplicate by URL hash while preserving first-seen order.
    deduped: dict[str, dict[str, Any]] = {}
    for item in combined:
        deduped.setdefault(item["id"], item)
    return list(deduped.values())
