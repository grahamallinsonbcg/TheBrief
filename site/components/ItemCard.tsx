"use client";

import { useState } from "react";
import { BriefItem } from "@/lib/types";
import { BookmarkButton } from "./BookmarkButton";

type ItemCardProps = {
  item: BriefItem;
};

export function ItemCard({ item }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
          <p className="mt-1 text-xs text-slate-500">
            {item.source} - {item.date}
          </p>
        </div>
        <BookmarkButton item={item} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Hide summary" : "Show summary"}
        </button>
        <a
          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          Read original
        </a>
      </div>

      {expanded ? <p className="mt-3 text-sm leading-6 text-slate-700">{item.summary}</p> : null}
    </article>
  );
}
