from __future__ import annotations

import json
import os
from collections import defaultdict
from typing import Any

from anthropic import Anthropic

STREAM_FALLBACK = "ai-tools-products"
STREAM_LABELS = {
    "model-releases": "Model Releases & Benchmarks",
    "research-papers": "Research Papers",
    "ai-tools-products": "AI Tools & Products",
    "scaled-ai-use-cases": "Case Studies: Scaled AI Use Cases",
    "data-analytics-agents": "Data & Analytics Agents",
    "context-data-prep": "Context & Data Preparation for AI",
}


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as file:
        return file.read().strip()


def _safe_json_load(raw: str) -> dict[str, Any]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def _extract_text(response: Any) -> str:
    chunks = []
    for part in getattr(response, "content", []):
        text = getattr(part, "text", None)
        if text:
            chunks.append(text)
    return "\n".join(chunks).strip()


def _summarize_without_llm(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "summary": (item.get("raw_text") or item.get("title") or "")[:500],
        "stream_tag": (item.get("streams") or [STREAM_FALLBACK])[0],
        "signal_score": 0.5,
    }


def process_items(
    items: list[dict[str, Any]],
    summarize_prompt_path: str = "pipeline/prompts/summarize.txt",
    commentary_prompt_path: str = "pipeline/prompts/commentary.txt",
    weekly_prompt_path: str = "pipeline/prompts/weekly_synthesis.txt",
    model: str = "claude-3-5-sonnet-latest",
) -> dict[str, Any]:
    """Generate per-item summaries, per-stream commentary, and optional weekly synthesis."""
    summarize_prompt = _read_text(summarize_prompt_path)
    commentary_prompt = _read_text(commentary_prompt_path)
    weekly_prompt = _read_text(weekly_prompt_path)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    client = Anthropic(api_key=api_key) if api_key else None

    processed_items: list[dict[str, Any]] = []

    for item in items:
        if not client:
            result = _summarize_without_llm(item)
        else:
            response = client.messages.create(
                model=model,
                max_tokens=500,
                temperature=0,
                messages=[
                    {
                        "role": "user",
                        "content": (
                            f"{summarize_prompt}\n\n"
                            "Choose stream_tag from: "
                            f"{', '.join(STREAM_LABELS.keys())}.\n\n"
                            f"TITLE: {item.get('title', '')}\n"
                            f"SOURCE: {item.get('source', '')}\n"
                            f"DATE: {item.get('date', '')}\n"
                            f"URL: {item.get('url', '')}\n\n"
                            f"RAW_TEXT:\n{item.get('raw_text', '')[:12000]}"
                        ),
                    }
                ],
            )
            result = _safe_json_load(_extract_text(response))
            if not result:
                result = _summarize_without_llm(item)

        stream_tag = result.get("stream_tag") or (item.get("streams") or [STREAM_FALLBACK])[0]
        if stream_tag not in STREAM_LABELS:
            stream_tag = STREAM_FALLBACK

        processed_items.append(
            {
                "id": item["id"],
                "title": item["title"],
                "url": item["url"],
                "source": item["source"],
                "date": item["date"],
                "summary": result.get("summary", item.get("raw_text", "")[:500]),
                "stream_tag": stream_tag,
                "signal_score": float(result.get("signal_score", 0.5)),
            }
        )

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in processed_items:
        grouped[item["stream_tag"]].append(item)

    stream_commentary: dict[str, str] = {}
    for stream_tag, stream_items in grouped.items():
        if not client:
            stream_commentary[stream_tag] = (
                f"{STREAM_LABELS[stream_tag]} contains {len(stream_items)} tracked update(s) in this edition."
            )
            continue

        response = client.messages.create(
            model=model,
            max_tokens=400,
            temperature=0.2,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"{commentary_prompt}\n\n"
                        f"STREAM: {stream_tag}\n"
                        f"ITEMS_JSON:\n{json.dumps(stream_items, ensure_ascii=True)}"
                    ),
                }
            ],
        )
        stream_commentary[stream_tag] = _extract_text(response)

    weekly_synthesis = ""
    if client and processed_items:
        response = client.messages.create(
            model=model,
            max_tokens=600,
            temperature=0.2,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"{weekly_prompt}\n\n"
                        f"ITEMS_JSON:\n{json.dumps(processed_items, ensure_ascii=True)}"
                    ),
                }
            ],
        )
        weekly_synthesis = _extract_text(response)

    return {
        "items": processed_items,
        "stream_commentary": stream_commentary,
        "weekly_synthesis": weekly_synthesis,
    }
