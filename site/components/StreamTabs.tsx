"use client";

import { useMemo, useState } from "react";
import { BriefEdition } from "@/lib/types";
import { Commentary } from "./Commentary";
import { ItemCard } from "./ItemCard";

type StreamTabsProps = {
  edition: BriefEdition;
};

export function StreamTabs({ edition }: StreamTabsProps) {
  const streams = useMemo(() => Object.entries(edition.streams), [edition.streams]);
  const [activeKey, setActiveKey] = useState<string>(streams[0]?.[0] ?? "");

  if (!streams.length) {
    return <p className="text-sm text-slate-600">No stream data available for this edition.</p>;
  }

  const activeStream = edition.streams[activeKey];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {streams.map(([key, stream]) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {stream.name} ({stream.items.length})
            </button>
          );
        })}
      </div>

      <Commentary text={activeStream.commentary} />

      <div className="space-y-3">
        {activeStream.items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
