export type BriefItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  date: string;
  summary: string;
  signal_score?: number;
};

export type BriefStream = {
  name: string;
  commentary: string;
  items: BriefItem[];
};

export type BriefEdition = {
  slug: string;
  date: string;
  type: "edition" | "weekly-wrap";
  synthesis?: string;
  streams: Record<string, BriefStream>;
};

export type EditionManifestEntry = {
  slug: string;
  date: string;
  type: "edition" | "weekly-wrap";
  title: string;
};

export type EditionManifest = {
  latest: string;
  editions: EditionManifestEntry[];
};
