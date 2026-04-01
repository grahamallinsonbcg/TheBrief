import click
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from build_edition import build_edition
from ingest import canonicalize_url, ingest_items
from process import process_items

DAY_TO_NAME = {
    "mon": "Edition 1",
    "wed": "Edition 2",
    "fri": "Edition 3",
    "sun": "Weekly Wrap-Up",
}


def _slug_for(day: str) -> str:
    date = datetime.now(timezone.utc).date().isoformat()
    return f"{date}-{day}"


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
        "type": "weekly-wrap" if day == "sun" else "edition",
        "title": DAY_TO_NAME[day],
    }

    editions = [item for item in manifest.get("editions", []) if item.get("slug") != slug]
    editions.append(entry)
    editions.sort(key=lambda item: item["slug"])
    manifest["editions"] = editions
    manifest["latest"] = slug
    _write_json(manifest_path, manifest)


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
def main(day: str, output_dir: str, skip_empty: bool) -> None:
    slug = _slug_for(day)
    date_value = slug[:10]
    output_path = Path(output_dir)
    seen_urls = _load_seen_urls(output_path, slug)

    items = ingest_items()
    new_items = [item for item in items if canonicalize_url(item["url"]) not in seen_urls]
    print(
        "Ingest stats "
        f"(day={day}): ingested={len(items)}, seen={len(seen_urls)}, new={len(new_items)}"
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
