import Link from "next/link";
import { BookmarksView } from "@/components/BookmarksView";
import { Header } from "@/components/Header";

export default function BookmarksPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header dateLabel="Saved items" />
      <div className="mx-auto w-full max-w-4xl px-6 py-6">
        <div className="mb-4">
          <Link
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
            href="/"
          >
            ← Back to latest edition
          </Link>
        </div>
        <BookmarksView />
      </div>
      <footer className="mt-12 border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
          <p className="text-xs text-slate-400">TheBrief · AI Signal Reader</p>
        </div>
      </footer>
    </main>
  );
}
