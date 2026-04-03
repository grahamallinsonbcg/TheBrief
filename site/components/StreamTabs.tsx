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
  const [activeKey, setActiveKey] = useState<string>("all");

  if (!streams.length) {
    return <p className="text-sm text-slate-600">No stream data available for this edition.</p>;
  }

  const totalItems = streams.reduce((sum, [, stream]) => sum + stream.items.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex overflow-x-auto border-b border-slate-200">
        {/* All tab */}
        <button
          type="button"
          onClick={() => setActiveKey("all")}
          className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 ${
            activeKey === "all"
              ? "border-accent text-accent"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          All
          <span
            className={`ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
              activeKey === "all" ? "bg-accent-light text-accent" : "bg-slate-100 text-slate-500"
            }`}
          >
            {totalItems}
          </span>
        </button>

        {/* Per-stream tabs */}
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

      {/* All view: each stream as a labeled section */}
      {activeKey === "all" ? (
        <div className="space-y-10">
          {streams.map(([key, stream]) => (
            <div key={key} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900">{stream.name}</h2>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <Commentary text={stream.commentary} />
              <div className="space-y-3">
                {stream.items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Single-stream view */
        <div className="space-y-4">
          <Commentary text={edition.streams[activeKey].commentary} />
          <div className="space-y-3">
            {edition.streams[activeKey].items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
