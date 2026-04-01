"use client";

import { BriefItem } from "./types";

const BOOKMARK_KEY = "thebrief.bookmarks";

export function readBookmarks(): BriefItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(BOOKMARK_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as BriefItem[];
  } catch {
    return [];
  }
}

export function isBookmarked(itemId: string): boolean {
  return readBookmarks().some((item) => item.id === itemId);
}

export function toggleBookmark(item: BriefItem): boolean {
  const bookmarks = readBookmarks();
  const exists = bookmarks.some((entry) => entry.id === item.id);
  const next = exists
    ? bookmarks.filter((entry) => entry.id !== item.id)
    : [item, ...bookmarks];
  window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
  return !exists;
}
