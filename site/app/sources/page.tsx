import Link from "next/link";
import { Header } from "@/components/Header";
import { SourcesEditor } from "@/components/SourcesEditor";
import { getSourceSnapshot } from "@/lib/sources";

export default async function SourcesPage() {
  const snapshot = await getSourceSnapshot();

  return (
    <main className="min-h-screen bg-slate-50">
      <Header dateLabel="Sources" />
      <div className="mx-auto w-full max-w-4xl px-6 py-6">
        <div className="mb-4">
          <Link
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
            href="/"
          >
            ← Back to latest edition
          </Link>
        </div>

        <SourcesEditor initialSnapshot={snapshot} />
      </div>
    </main>
  );
}
