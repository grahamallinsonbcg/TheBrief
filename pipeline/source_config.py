from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import yaml

DEFAULT_STREAM = "ai-trends-news"


class _NoAliasDumper(yaml.SafeDumper):
    def ignore_aliases(self, data: Any) -> bool:  # noqa: ANN401
        return True


def _load_yaml(path: str) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as file:
        return yaml.safe_load(file) or {}


def _write_yaml(path: str, payload: dict[str, Any]) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, "w", encoding="utf-8") as file:
        yaml.dump(payload, file, sort_keys=False, allow_unicode=False, Dumper=_NoAliasDumper)


def _write_json(path: str, payload: dict[str, Any]) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=True, indent=2)
        file.write("\n")


def _normalized_streams(value: Any) -> list[str]:
    if not isinstance(value, list):
        return [DEFAULT_STREAM]
    cleaned = [v.strip() for v in value if isinstance(v, str) and v.strip()]
    return cleaned or [DEFAULT_STREAM]


def build_execution_sources(source_inputs: dict[str, Any]) -> dict[str, Any]:
    sources: list[dict[str, Any]] = []
    manual_sources: list[dict[str, Any]] = []
    streams = [
        "ai-trends-news",
        "model-releases-benchmarks",
        "research-thought-leadership",
    ]

    for site in source_inputs.get("trusted_sites", []):
        if not isinstance(site, dict):
            continue
        name = (site.get("name") or "").strip()
        base_url = (site.get("url") or "").strip()
        rss_url = (site.get("rss_url") or "").strip()
        category_tags = _normalized_streams(site.get("category_tags"))
        if not name:
            continue
        if rss_url:
            sources.append(
                {
                    "name": f"{name} (RSS)",
                    "tier": "rss",
                    "url": rss_url,
                    "streams": category_tags,
                }
            )
        if base_url:
            sources.append(
                {
                    "name": f"{name} (Site)",
                    "tier": "scrape",
                    "url": base_url,
                    "streams": category_tags,
                }
            )

    for person in source_inputs.get("individuals", []):
        if not isinstance(person, dict):
            continue
        name = (person.get("name") or "").strip()
        if not name:
            continue
        manual_sources.append(
            {
                "name": name,
                "tier": "manual",
                "streams": _normalized_streams(person.get("category_tags")),
            }
        )

    return {
        "streams": streams,
        "sources": sources,
        "manual_sources": manual_sources,
    }


def build_public_snapshot(source_inputs: dict[str, Any]) -> dict[str, Any]:
    trusted_sites = []
    for site in source_inputs.get("trusted_sites", []):
        if not isinstance(site, dict):
            continue
        name = (site.get("name") or "").strip()
        url = (site.get("url") or "").strip()
        if not name or not url:
            continue
        trusted_sites.append(
            {
                "name": name,
                "url": url,
                "domain": urlparse(url).netloc.lower(),
                "category_tags": _normalized_streams(site.get("category_tags")),
            }
        )

    individuals = []
    for person in source_inputs.get("individuals", []):
        if not isinstance(person, dict):
            continue
        name = (person.get("name") or "").strip()
        if not name:
            continue
        individuals.append(
            {
                "name": name,
                "note": (person.get("note") or "").strip(),
                "url": (person.get("url") or person.get("profile_url") or "").strip(),
                "category_tags": _normalized_streams(person.get("category_tags")),
            }
        )

    search_terms = []
    for term in source_inputs.get("search_terms", []):
        if isinstance(term, str) and term.strip():
            search_terms.append({"term": term.strip(), "category_tag": DEFAULT_STREAM})
            continue
        if not isinstance(term, dict):
            continue
        value = (term.get("term") or "").strip()
        if not value:
            continue
        search_terms.append(
            {
                "term": value,
                "category_tag": (term.get("category_tag") or DEFAULT_STREAM).strip(),
            }
        )

    return {
        "last_updated_utc": datetime.now(timezone.utc).isoformat(),
        "applies_to": "next edition",
        "note": "Configuration is centrally managed for quality control.",
        "trusted_sites": trusted_sites,
        "individuals": individuals,
        "search_terms": search_terms,
    }


def sync_source_configs(
    *,
    source_inputs_path: str = "pipeline/config/source_inputs.yaml",
    execution_sources_path: str = "pipeline/config/sources.yaml",
    public_snapshot_path: str = "site/public/config/sources.public.json",
) -> dict[str, Any]:
    source_inputs = _load_yaml(source_inputs_path)
    execution_sources = build_execution_sources(source_inputs)
    public_snapshot = build_public_snapshot(source_inputs)
    _write_yaml(execution_sources_path, execution_sources)
    _write_json(public_snapshot_path, public_snapshot)
    return public_snapshot
