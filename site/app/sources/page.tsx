import Link from "next/link";
import { Header } from "@/components/Header";
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

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">How this works</h2>
          <p className="mt-2 text-sm text-slate-600">
            Configuration is centrally managed for quality control. Changes apply to the next edition cycle.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Last updated: {new Date(snapshot.last_updated_utc).toLocaleString()}
          </p>
        </section>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Trusted Sites</h3>
          <ul className="mt-3 space-y-2">
            {snapshot.trusted_sites.map((site) => (
              <li key={site.name} className="rounded-lg border border-slate-100 p-3">
                <a
                  href={site.url}
                  className="font-medium text-accent hover:text-accent-dark"
                  target="_blank"
                  rel="noreferrer"
                >
                  {site.name}
                </a>
                <p className="text-xs text-slate-500">{site.domain}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Individuals</h3>
          <ul className="mt-3 space-y-2">
            {snapshot.individuals.map((person) => (
              <li key={person.name} className="rounded-lg border border-slate-100 p-3">
                <p className="font-medium text-slate-900">{person.name}</p>
                {person.note && <p className="text-sm text-slate-600">{person.note}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Search Terms</h3>
          <ul className="mt-3 space-y-2">
            {snapshot.search_terms.map((term) => (
              <li key={term.term} className="rounded-lg border border-slate-100 p-3">
                <p className="font-medium text-slate-900">{term.term}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
