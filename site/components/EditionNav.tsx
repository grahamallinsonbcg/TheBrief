import Link from "next/link";
import { EditionManifestEntry } from "@/lib/types";

type EditionNavProps = {
  editions: EditionManifestEntry[];
  currentSlug: string;
};

export function EditionNav({ editions, currentSlug }: EditionNavProps) {
  const currentIndex = editions.findIndex((entry) => entry.slug === currentSlug);
  const previous = currentIndex > 0 ? editions[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < editions.length - 1 ? editions[currentIndex + 1] : null;

  return (
    <nav className="flex items-center justify-between py-3 text-sm">
      <div className="w-1/3">
        {previous ? (
          <Link
            href={`/edition/${previous.slug}`}
            className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-dark transition-colors"
          >
            <span>←</span>
            <span className="hidden sm:inline">{previous.date}</span>
            <span className="sm:hidden">Previous</span>
          </Link>
        ) : (
          <span className="text-slate-300">← Previous</span>
        )}
      </div>
      <Link
        href="/bookmarks"
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 font-medium text-slate-700 hover:border-accent hover:text-accent transition-colors"
      >
        Saved
      </Link>
      <div className="w-1/3 flex justify-end">
        {next ? (
          <Link
            href={`/edition/${next.slug}`}
            className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-dark transition-colors"
          >
            <span className="hidden sm:inline">{next.date}</span>
            <span className="sm:hidden">Next</span>
            <span>→</span>
          </Link>
        ) : (
          <span className="text-slate-300">Next →</span>
        )}
      </div>
    </nav>
  );
}
