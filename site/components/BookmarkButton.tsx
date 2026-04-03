"use client";

import { useState } from "react";
import { BriefItem } from "@/lib/types";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";

type BookmarkButtonProps = {
  item: BriefItem;
};

export function BookmarkButton({ item }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(() => isBookmarked(item.id));

  return (
    <button
      type="button"
      aria-label={saved ? "Remove bookmark" : "Bookmark this item"}
      onClick={() => setSaved(toggleBookmark(item))}
      className={`flex-shrink-0 rounded p-1 transition-colors duration-150 ${
        saved
          ? "text-accent"
          : "text-slate-300 hover:text-accent"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    </button>
  );
}
