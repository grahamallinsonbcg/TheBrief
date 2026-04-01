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
      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
      onClick={() => setSaved(toggleBookmark(item))}
    >
      {saved ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
