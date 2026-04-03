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
      <div className="flex overflow-x-auto border-b border-slate-200">
        {streams.map(([key, stream]) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {stream.name}
              <span
                className={`ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                  isActive ? "bg-accent-light text-accent" : "bg-slate-100 text-slate-500"
                }`}
              >
                {stream.items.length}
              </span>
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
