from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from typing import Any

import feedparser
import requests
import yaml
from bs4 import BeautifulSoup

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


def _is_recent(date_str: str, days: int = 14) -> bool:
    try:
        cutoff = datetime.now(timezone.utc).date() - timedelta(days=days)
        return datetime.fromisoformat(date_str).date() >= cutoff
    except ValueError:
        return True


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
    canonical_url = canonicalize_url(url)
    url_hash = hashlib.sha256(canonical_url.encode("utf-8")).hexdigest()
    return {
        "id": url_hash,
        "title": title.strip(),
        "url": canonical_url,
        "source": source.strip(),
        "date": date,
        "raw_text": raw_text.strip(),
        "streams": streams,
    }


def canonicalize_url(url: str) -> str:
    parsed = urlparse(url.strip())
    scheme = parsed.scheme or "https"
    netloc = parsed.netloc.lower()
    path = parsed.path or "/"
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    query_pairs = parse_qsl(parsed.query, keep_blank_values=False)
    blocked = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"}
    clean_query = urlencode([(k, v) for k, v in query_pairs if k not in blocked])
    return urlunparse((scheme, netloc, path, "", clean_query, ""))


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


def _ingest_scrape_source(
    source: Source, firecrawl_api_key: str | None, max_links: int
) -> list[dict[str, Any]]:
    if not firecrawl_api_key or FirecrawlApp is None:
        return []

    app = FirecrawlApp(api_key=firecrawl_api_key)
    links = _discover_article_links(source.url, max_links=max_links)
    if not links:
        links = [source.url]

    items: list[dict[str, Any]] = []
    for link in links:
        response = app.scrape_url(link, formats=["markdown"])
        markdown = ""
        metadata: dict[str, Any] = {}
        if isinstance(response, dict):
            markdown = response.get("markdown", "") or ""
            metadata = response.get("metadata", {}) or {}
        if not markdown:
            continue

        title = metadata.get("title") or _title_from_url(link) or source.name
        items.append(
            _normalize_item(
                title=title,
                url=link,
                source=source.name,
                date=datetime.now(timezone.utc).date().isoformat(),
                raw_text=markdown[:8000],
                streams=source.streams,
            )
        )
    return items


def _title_from_url(url: str) -> str:
    path = urlparse(url).path.strip("/")
    if not path:
        return ""
    candidate = path.split("/")[-1]
    candidate = re.sub(r"[-_]+", " ", candidate)
    return candidate[:80].title()


def _looks_like_article_path(path: str) -> bool:
    normalized = path.strip("/")
    if not normalized:
        return False
    if normalized.count("/") < 1 and not re.search(r"\d{4}", normalized):
        return False
    blocked = {
        "about",
        "careers",
        "pricing",
        "contact",
        "news",
        "blog",
        "tags",
        "tag",
        "category",
        "categories",
        "archive",
        "archives",
        "authors",
    }
    leaf = normalized.split("/")[-1].lower()
    if leaf in blocked:
        return False
    # Home/list pages often end in index-like paths.
    if leaf in {"index", "latest", "all"}:
        return False
    return True


def _discover_article_links(base_url: str, max_links: int = 5) -> list[str]:
    try:
        response = requests.get(
            base_url,
            timeout=20,
            headers={"User-Agent": "TheBriefBot/1.0"},
        )
        response.raise_for_status()
    except requests.RequestException:
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc

    scored_links: list[tuple[int, str]] = []
    for tag in soup.select("a[href]"):
        href = tag.get("href", "").strip()
        if not href:
            continue
        if href.startswith("/"):
            href = f"{parsed_base.scheme}://{base_domain}{href}"
        canonical = canonicalize_url(href)
        parsed = urlparse(canonical)
        if parsed.netloc != base_domain:
            continue
        if not _looks_like_article_path(parsed.path):
            continue
        score = 0
        if re.search(r"/20\d{2}/", parsed.path):
            score += 2
        if re.search(r"/(blog|news|posts)/", parsed.path):
            score += 1
        scored_links.append((score, canonical))

    deduped: list[str] = []
    seen: set[str] = set()
    for _, link in sorted(scored_links, key=lambda item: item[0], reverse=True):
        if link in seen:
            continue
        seen.add(link)
        deduped.append(link)
        if len(deduped) >= max_links:
            break
    return deduped


def _ingest_manual_items(path: str) -> list[dict[str, Any]]:
    data = _load_yaml(path)
    items = data.get("items", [])
    normalized: list[dict[str, Any]] = []
    for item in items:
        url = (item.get("url") or "").strip()
        title = (item.get("title") or "").strip()
        if not url or not title:
            continue
        parsed = urlparse(url)
        if not _looks_like_article_path(parsed.path):
            print(f"Skipping manual pick (non-article URL): {url}")
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
    max_links_per_scrape_source: int = 8,
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
            combined.extend(
                _ingest_scrape_source(
                    source,
                    firecrawl_api_key,
                    max_links_per_scrape_source,
                )
            )

    combined.extend(_ingest_manual_items(manual_picks_path))

    # Filter to recent articles only.
    combined = [item for item in combined if _is_recent(item["date"])]

    # Deduplicate by URL hash while preserving first-seen order.
    deduped: dict[str, dict[str, Any]] = {}
    for item in combined:
        deduped.setdefault(item["id"], item)
    return list(deduped.values())
