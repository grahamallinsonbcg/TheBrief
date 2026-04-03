import click
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
import yaml

from build_edition import build_edition
from ingest import canonicalize_url, discover_items_with_llm_search, ingest_items
from process import process_items
from source_config import sync_source_configs

DAY_TO_NAME = {
    "mon": "Edition 1",
    "wed": "Edition 2",
    "fri": "Weekly Edition",
    "sun": "Weekly Wrap-Up",
}


def _slug_for(day: str) -> str:
    date = datetime.now(timezone.utc).date().isoformat()
    return f"{date}-{day}"


def _window_for(day: str) -> tuple[str, str]:
    end_date = datetime.now(timezone.utc).date()
    # Favor a broader weekly pull for Friday and Sunday editions.
    days_back = {"mon": 3, "wed": 2, "fri": 7, "sun": 7}[day]
    start_date = end_date - timedelta(days=days_back)
    return start_date.isoformat(), end_date.isoformat()


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=True, indent=2)
        file.write("\n")


def _update_manifest(manifest_path: Path, slug: str, day: str, date_value: str) -> None:
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as file:
            manifest = json.load(file)
    else:
        manifest = {"latest": slug, "editions": []}

    entry = {
        "slug": slug,
        "date": date_value,
        "type": "edition",
        "title": DAY_TO_NAME[day],
    }

    editions = [item for item in manifest.get("editions", []) if item.get("slug") != slug]
    editions.append(entry)
    editions.sort(key=lambda item: item["slug"])
    manifest["editions"] = editions
    manifest["latest"] = slug
    _write_json(manifest_path, manifest)


def _load_trusted_domains(sources_path: str = "pipeline/config/sources.yaml") -> list[str]:
    with open(sources_path, "r", encoding="utf-8") as file:
        payload = yaml.safe_load(file) or {}
    domains: list[str] = []
    for source in payload.get("sources", []):
        url = source.get("url")
        if isinstance(url, str) and url.strip():
            domains.append(urlparse(url).netloc.lower())
    return sorted(set(domains))


def _within_window(date_value: str, start_date: str, end_date: str) -> bool:
    try:
        target = datetime.fromisoformat(date_value).date()
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
    except ValueError:
        return False
    return start <= target <= end


def _load_seen_urls(output_path: Path, current_slug: str) -> set[str]:
    seen: set[str] = set()
    if not output_path.exists():
        return seen

    for file_path in output_path.glob("*.json"):
        if file_path.name == "index.json" or file_path.stem == current_slug:
            continue
        try:
            with open(file_path, "r", encoding="utf-8") as file:
                payload: dict[str, Any] = json.load(file)
        except (json.JSONDecodeError, OSError):
            continue
        streams = payload.get("streams", {})
        if not isinstance(streams, dict):
            continue
        for stream in streams.values():
            if not isinstance(stream, dict):
                continue
            for item in stream.get("items", []):
                url = item.get("url")
                if isinstance(url, str) and url.strip():
                    seen.add(canonicalize_url(url))
    return seen


@click.command()
@click.option("--day", type=click.Choice(["mon", "wed", "fri", "sun"]), required=True)
@click.option(
    "--output-dir",
    default="site/public/editions",
    show_default=True,
    help="Directory where edition JSON and manifest are written.",
)
@click.option(
    "--skip-empty",
    is_flag=True,
    default=False,
    help="Do not write a new edition file when there are no net-new items.",
)
@click.option(
    "--discovery-days",
    type=int,
    default=None,
    help="Override day-based discovery window with fixed N-day lookback.",
)
@click.option(
    "--allow-out-of-window",
    is_flag=True,
    default=False,
    help="Debug option to keep discovered items even if their dates fall outside window.",
)
@click.option(
    "--target-items",
    type=int,
    default=30,
    show_default=True,
    help="Target minimum item pool size before selection.",
)
@click.option(
    "--max-items",
    type=int,
    default=30,
    show_default=True,
    help="Hard cap of items written into the edition.",
)
def main(
    day: str,
    output_dir: str,
    skip_empty: bool,
    discovery_days: int | None,
    allow_out_of_window: bool,
    target_items: int,
    max_items: int,
) -> None:
    sources_snapshot = sync_source_configs()
    slug = _slug_for(day)
    date_value = slug[:10]
    output_path = Path(output_dir)
    seen_urls = _load_seen_urls(output_path, slug)
    window_start, window_end = _window_for(day)
    if discovery_days is not None and discovery_days > 0:
        override_start = (datetime.now(timezone.utc).date() - timedelta(days=discovery_days)).isoformat()
        window_start = override_start
    trusted_domains = sorted(
        {
            site.get("domain", "").strip().lower()
            for site in sources_snapshot.get("trusted_sites", [])
            if isinstance(site, dict) and site.get("domain")
        }
    ) or _load_trusted_domains()
    search_terms = [
        term.get("term", "").strip()
        for term in sources_snapshot.get("search_terms", [])
        if isinstance(term, dict) and term.get("term")
    ]
    if not os.getenv("FIRECRAWL_API_KEY"):
        print("Warning: FIRECRAWL_API_KEY is not set; scrape discovery will be skipped.")

    trusted_items = ingest_items()
    discovered_items, discovery_stats = discover_items_with_llm_search(
        day=day,
        window_start=window_start,
        window_end=window_end,
        trusted_domains=trusted_domains,
        search_terms=search_terms,
    )
    merged = trusted_items + discovered_items
    within_window = (
        merged
        if allow_out_of_window
        else [item for item in merged if _within_window(item.get("date", ""), window_start, window_end)]
    )
    # If volume is low, widen the date window once by 7 days.
    widened = False
    if not allow_out_of_window and len(within_window) < target_items:
        widened_start = (datetime.fromisoformat(window_start).date() - timedelta(days=7)).isoformat()
        within_window = [
            item for item in merged if _within_window(item.get("date", ""), widened_start, window_end)
        ]
        window_start = widened_start
        widened = True

    deduped_seen_count = sum(1 for item in within_window if canonicalize_url(item["url"]) in seen_urls)
    new_items = [item for item in within_window if canonicalize_url(item["url"]) not in seen_urls]
    if max_items > 0:
        new_items = new_items[:max_items]
    print(
        "Ingest stats "
        f"(day={day}, window={window_start}..{window_end}): "
        f"trusted={len(trusted_items)}, discovered={len(discovered_items)}, "
        f"within_window={len(within_window)}, seen={len(seen_urls)}, deduped_seen={deduped_seen_count}, "
        f"new={len(new_items)}, target_items={target_items}, max_items={max_items}, widened={widened}"
    )
    print(
        "Discovery diagnostics: "
        f"discovery_raw_count={discovery_stats['discovery_raw_count']}, "
        f"discovery_valid_count={discovery_stats['discovery_valid_count']}, "
        f"dropped_missing_fields={discovery_stats['dropped_missing_fields']}, "
        f"dropped_bad_url={discovery_stats['dropped_bad_url']}, "
        f"dropped_out_of_window={discovery_stats['dropped_out_of_window']}"
    )

    if not new_items and skip_empty:
        print("No net-new items found. Skipping edition write because --skip-empty was set.")
        return

    processed = process_items(new_items)
    edition = build_edition(slug=slug, day=day, processed=processed, run_date=date_value)
    if not new_items:
        edition["note"] = "No net-new items were discovered for this run."

    edition_path = output_path / f"{slug}.json"
    manifest_path = output_path / "index.json"
    _write_json(edition_path, edition)
    _update_manifest(manifest_path, slug, day, date_value)
    print(f"Wrote edition file: {edition_path}")
    print(f"Updated manifest: {manifest_path}")


if __name__ == "__main__":
    main()
