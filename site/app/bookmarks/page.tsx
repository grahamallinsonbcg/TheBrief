import Link from "next/link";
import { BookmarksView } from "@/components/BookmarksView";
import { Header } from "@/components/Header";

export default function BookmarksPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header dateLabel="Saved items" />
      <div className="mx-auto w-full max-w-4xl px-6 py-6">
        <div className="mb-4">
          <Link className="text-sm text-slate-700 underline" href="/">
            Back to latest edition
          </Link>
        </div>
        <BookmarksView />
      </div>
    </main>
  );
}
