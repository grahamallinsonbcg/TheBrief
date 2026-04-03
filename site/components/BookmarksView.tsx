"use client";

import { useState } from "react";
import { readBookmarks } from "@/lib/bookmarks";
import { BriefItem } from "@/lib/types";

export function BookmarksView() {
  const [items] = useState<BriefItem[]>(() => readBookmarks());

  return (
    <section className="space-y-3">
      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-slate-500">No bookmarks yet.</p>
          <p className="mt-1 text-xs text-slate-400">Bookmark items while reading an edition.</p>
        </div>
      ) : (
        items.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold leading-snug text-slate-900">{item.title}</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {item.source} · {item.date}
            </p>
            <p className="mt-2.5 text-sm leading-6 text-slate-600">{item.summary}</p>
            <a
              className="mt-3 inline-block text-xs font-semibold text-accent hover:text-accent-dark transition-colors"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              Read original →
            </a>
          </article>
        ))
      )}
    </section>
  );
}
