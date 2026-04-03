import { notFound } from "next/navigation";
import { EditionNav } from "@/components/EditionNav";
import { Header } from "@/components/Header";
import { StreamTabs } from "@/components/StreamTabs";
import { getEditionBySlug, getEditionManifest } from "@/lib/editions";

type EditionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditionPage({ params }: EditionPageProps) {
  const { slug } = await params;
  const manifest = await getEditionManifest();
  const exists = manifest.editions.some((entry) => entry.slug === slug);
  if (!exists) {
    notFound();
  }

  const edition = await getEditionBySlug(slug);

  return (
    <main className="min-h-screen bg-slate-50">
      <Header dateLabel={edition.date} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6">
        <EditionNav editions={manifest.editions} currentSlug={edition.slug} />
        <StreamTabs edition={edition} />
      </div>
      <footer className="mt-12 border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <p className="text-xs text-slate-400">TheBrief · AI Signal Reader</p>
          <p className="text-xs text-slate-400">{edition.date}</p>
        </div>
      </footer>
    </main>
  );
}
