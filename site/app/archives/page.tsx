import Link from "next/link";
import { Header } from "@/components/Header";
import { getEditionManifest } from "@/lib/editions";

export default async function ArchivesPage() {
  const manifest = await getEditionManifest();
  const sorted = [...manifest.editions].sort((a, b) => b.slug.localeCompare(a.slug));

  return (
    <main className="min-h-screen bg-slate-50">
      <Header dateLabel="Archives" />
      <div className="mx-auto w-full max-w-4xl px-6 py-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Weekly archives</h2>
          <p className="mt-2 text-sm text-slate-600">
            Browse previous editions from newest to oldest.
          </p>
          <ul className="mt-4 space-y-2">
            {sorted.map((entry) => (
              <li key={entry.slug} className="rounded-lg border border-slate-100 p-3">
                <Link
                  href={`/edition/${entry.slug}`}
                  className="font-medium text-accent transition-colors hover:text-accent-dark"
                >
                  {entry.date} - {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
