"use client";

import { useState } from "react";
import { readBookmarks } from "@/lib/bookmarks";
import { BriefItem } from "@/lib/types";

export function BookmarksView() {
  const [items] = useState<BriefItem[]>(() => readBookmarks());

  return (
    <section className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-slate-600">No bookmarks yet.</p>
      ) : (
        items.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {item.source} - {item.date}
            </p>
            <p className="mt-3 text-sm text-slate-700">{item.summary}</p>
            <a className="mt-3 inline-block text-sm font-medium text-slate-900 underline" href={item.url} target="_blank" rel="noreferrer">
              Read original
            </a>
          </article>
        ))
      )}
    </section>
  );
}
