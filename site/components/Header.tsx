"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderProps = {
  dateLabel?: string;
};

export function Header({ dateLabel: _dateLabel }: HeaderProps) {
  const pathname = usePathname();
  const navClass = (href: string) =>
    `inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
      pathname === href || (href === "/" && pathname.startsWith("/edition/"))
        ? "border-accent bg-accent text-white"
        : "border-slate-200 text-slate-700 hover:border-accent hover:text-accent"
    }`;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="border-l-[3px] border-accent pl-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            AI Signal Reader
          </p>
          <h1 className="text-2xl font-bold text-slate-900">TheBrief</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className={navClass("/")}>
            Home
          </Link>
          <Link href="/archives" className={navClass("/archives")}>
            Archives
          </Link>
          <Link href="/bookmarks" className={navClass("/bookmarks")}>
            Bookmarks
          </Link>
          <Link href="/sources" className={navClass("/sources")}>
            Sources
          </Link>
        </div>
      </div>
    </header>
  );
}
