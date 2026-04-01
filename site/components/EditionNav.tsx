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
    <nav className="flex items-center justify-between border-y border-slate-200 py-3 text-sm">
      <div>
        {previous ? <Link href={`/edition/${previous.slug}`}>Previous edition</Link> : <span className="text-slate-400">Previous edition</span>}
      </div>
      <Link href="/bookmarks" className="font-medium text-slate-700">
        Bookmarks
      </Link>
      <div>{next ? <Link href={`/edition/${next.slug}`}>Next edition</Link> : <span className="text-slate-400">Next edition</span>}</div>
    </nav>
  );
}
