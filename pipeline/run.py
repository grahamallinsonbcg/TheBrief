import click
import json
from datetime import datetime, timezone
from pathlib import Path

from build_edition import build_edition
from ingest import ingest_items
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


@click.command()
@click.option("--day", type=click.Choice(["mon", "wed", "fri", "sun"]), required=True)
@click.option(
    "--output-dir",
    default="site/public/editions",
    show_default=True,
    help="Directory where edition JSON and manifest are written.",
)
def main(day: str, output_dir: str) -> None:
    slug = _slug_for(day)
    date_value = slug[:10]

    items = ingest_items()
    print(f"Ingest complete for {day}. Collected {len(items)} normalized item(s).")

    processed = process_items(items)
    edition = build_edition(slug=slug, day=day, processed=processed, run_date=date_value)

    output_path = Path(output_dir)
    edition_path = output_path / f"{slug}.json"
    manifest_path = output_path / "index.json"
    _write_json(edition_path, edition)
    _update_manifest(manifest_path, slug, day, date_value)
    print(f"Wrote edition file: {edition_path}")
    print(f"Updated manifest: {manifest_path}")


if __name__ == "__main__":
    main()
