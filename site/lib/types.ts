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

export type SourceSnapshot = {
  last_updated_utc: string;
  applies_to: string;
  note: string;
  trusted_sites: Array<{
    name: string;
    url: string;
    rss_url?: string;
    domain: string;
    category_tags: string[];
  }>;
  individuals: Array<{
    name: string;
    note: string;
    url?: string;
    category_tags: string[];
  }>;
  search_terms: Array<{
    term: string;
    category_tag: string;
  }>;
};
