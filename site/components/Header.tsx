import Link from "next/link";

type HeaderProps = {
  dateLabel?: string;
};

export function Header({ dateLabel }: HeaderProps) {
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
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-accent hover:text-accent"
          >
            Home
          </Link>
          <Link
            href="/archives"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-accent hover:text-accent"
          >
            Archives
          </Link>
          <Link
            href="/bookmarks"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-accent hover:text-accent"
          >
            Bookmarks
          </Link>
          <Link
            href="/sources"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-accent hover:text-accent"
          >
            Sources
          </Link>
          {dateLabel && <div className="ml-2 text-sm font-medium text-slate-500">{dateLabel}</div>}
        </div>
      </div>
    </header>
  );
}
