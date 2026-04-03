"use client";

import { BriefItem } from "@/lib/types";
import { BookmarkButton } from "./BookmarkButton";

type ItemCardProps = {
  item: BriefItem;
};

function SignalBadge({ score }: { score: number }) {
  const dotClass =
    score >= 0.8 ? "bg-emerald-500" : score >= 0.5 ? "bg-amber-400" : "bg-slate-300";
  const label = score >= 0.8 ? "High signal" : score >= 0.5 ? "Signal" : "Low signal";
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-shadow duration-150">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {item.signal_score !== undefined && (
                <div className="mb-1">
                  <SignalBadge score={item.signal_score} />
                </div>
              )}
              <h4 className="text-sm font-bold leading-snug text-slate-900">{item.title}</h4>
              <p className="mt-0.5 text-xs text-slate-400">
                {item.source} · {item.date}
              </p>
            </div>
            <BookmarkButton item={item} />
          </div>
          <p className="mt-2.5 text-sm leading-6 text-slate-600">{item.summary}</p>
          <div className="mt-3">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors"
            >
              Read original →
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
