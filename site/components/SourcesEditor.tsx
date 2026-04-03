"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SourceSnapshot } from "@/lib/types";

type Props = {
  initialSnapshot: SourceSnapshot;
};

const STORAGE_KEY = "thebrief.sources.editor.v1";

const STREAM_LABELS: Record<string, string> = {
  "ai-trends-news": "AI Trends & News",
  "model-releases-benchmarks": "Model Releases & Benchmarks",
  "research-thought-leadership": "Research & Thought Leadership",
};

function loadStoredSnapshot(initialSnapshot: SourceSnapshot): SourceSnapshot {
  if (typeof window === "undefined") {
    return initialSnapshot;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialSnapshot;
    return JSON.parse(raw) as SourceSnapshot;
  } catch {
    return initialSnapshot;
  }
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{children}</span>
  );
}

export function SourcesEditor({ initialSnapshot }: Props) {
  const stored = loadStoredSnapshot(initialSnapshot);
  const [companies, setCompanies] = useState(stored.trusted_sites);
  const [thoughtLeaders, setThoughtLeaders] = useState(stored.individuals);
  const [searchTerms, setSearchTerms] = useState(stored.search_terms);

  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [companyRssUrl, setCompanyRssUrl] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderUrl, setLeaderUrl] = useState("");
  const [leaderNote, setLeaderNote] = useState("");
  const [searchTermValue, setSearchTermValue] = useState("");
  const [searchTermCategory, setSearchTermCategory] = useState("ai-trends-news");
  const [adminToken, setAdminToken] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const payload: SourceSnapshot = {
      ...initialSnapshot,
      trusted_sites: companies,
      individuals: thoughtLeaders,
      search_terms: searchTerms,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [companies, thoughtLeaders, searchTerms, initialSnapshot]);

  const today = useMemo(() => new Date().toLocaleString(), []);

  const addCompany = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyName.trim() || !companyUrl.trim()) return;
    let domain = "";
    try {
      domain = new URL(companyUrl.trim()).host.toLowerCase();
    } catch {
      return;
    }
    setCompanies((prev) => [
      ...prev,
      {
        name: companyName.trim(),
        url: companyUrl.trim(),
        rss_url: companyRssUrl.trim() || undefined,
        domain,
        category_tags: ["ai-trends-news"],
      },
    ]);
    setCompanyName("");
    setCompanyUrl("");
    setCompanyRssUrl("");
  };

  const addLeader = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!leaderName.trim()) return;
    setThoughtLeaders((prev) => [
      ...prev,
      {
        name: leaderName.trim(),
        note: leaderNote.trim(),
        url: leaderUrl.trim() || undefined,
        category_tags: ["research-thought-leadership"],
      },
    ]);
    setLeaderName("");
    setLeaderUrl("");
    setLeaderNote("");
  };

  const addSearchTerm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchTermValue.trim()) return;
    setSearchTerms((prev) => [
      ...prev,
      { term: searchTermValue.trim(), category_tag: searchTermCategory },
    ]);
    setSearchTermValue("");
    setSearchTermCategory("ai-trends-news");
  };

  const updateCompany = (index: number, field: "name" | "url" | "rss_url", value: string) => {
    setCompanies((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "url") {
          try {
            updated.domain = new URL(value).host.toLowerCase();
          } catch {
            updated.domain = item.domain;
          }
        }
        return updated;
      })
    );
  };

  const updateCompanyCategoryTags = (index: number, tag: string, checked: boolean) => {
    setCompanies((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const tags = checked
          ? [...(item.category_tags || []), tag]
          : (item.category_tags || []).filter((t) => t !== tag);
        return { ...item, category_tags: tags.length ? tags : ["ai-trends-news"] };
      })
    );
  };

  const removeCompany = (index: number) => {
    setCompanies((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLeader = (index: number, field: "name" | "url" | "note", value: string) => {
    setThoughtLeaders((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const updateLeaderCategoryTags = (index: number, tag: string, checked: boolean) => {
    setThoughtLeaders((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const tags = checked
          ? [...(item.category_tags || []), tag]
          : (item.category_tags || []).filter((t) => t !== tag);
        return { ...item, category_tags: tags.length ? tags : ["research-thought-leadership"] };
      })
    );
  };

  const removeLeader = (index: number) => {
    setThoughtLeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSearchTerm = (index: number, value: string) => {
    setSearchTerms((prev) => prev.map((item, i) => (i === index ? { ...item, term: value } : item)));
  };

  const updateSearchTermCategory = (index: number, category: string) => {
    setSearchTerms((prev) =>
      prev.map((item, i) => (i === index ? { ...item, category_tag: category } : item))
    );
  };

  const removeSearchTerm = (index: number) => {
    setSearchTerms((prev) => prev.filter((_, i) => i !== index));
  };

  const saveRuntimeConfig = async () => {
    setSaveMessage("Saving...");
    const payload = {
      trusted_sites: companies.map((site) => ({
        name: site.name,
        url: site.url,
        rss_url: site.rss_url || "",
        category_tags: site.category_tags || ["ai-trends-news"],
      })),
      individuals: thoughtLeaders.map((person) => ({
        name: person.name,
        url: person.url || "",
        note: person.note || "",
        category_tags: person.category_tags || ["research-thought-leadership"],
      })),
      search_terms: searchTerms.map((term) => ({
        term: term.term,
        category_tag: term.category_tag || "ai-trends-news",
      })),
    };
    try {
      const response = await fetch("/api/source-inputs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setSaveMessage("Save failed (check admin token).");
        return;
      }
      setSaveMessage("Saved. Pipeline will pull this config next run.");
    } catch {
      setSaveMessage("Save failed (network/server error).");
    }
  };

  const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm w-full";
  const selectClass = "rounded border border-slate-300 px-3 py-2 text-sm w-full bg-white";
  const deleteBtnClass =
    "rounded border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-red-600 whitespace-nowrap";

  return (
    <>
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">How this works</h2>
        <p className="mt-2 text-sm text-slate-600">
          Edit the sources below and save with your admin token. The pipeline will pull this
          configuration on the next run to determine which sites to scrape and what to search for.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Snapshot updated: {new Date(initialSnapshot.last_updated_utc).toLocaleString()} · Local
          edits: {today}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Admin token"
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
          />
          <button
            className="rounded bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white"
            type="button"
            onClick={saveRuntimeConfig}
          >
            Save for next run
          </button>
          {saveMessage && <p className="text-xs text-slate-500">{saveMessage}</p>}
        </div>
      </section>

      {/* Companies */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Companies</h3>
        <p className="mt-1 text-sm text-slate-500">
          Blog and news pages scraped each run. Add an RSS Feed URL where available for faster,
          more reliable ingestion.
        </p>
        <ul className="mt-4 space-y-4">
          {companies.map((site, index) => (
            <li key={`${site.name}-${site.url}-${index}`} className="rounded-lg border border-slate-100 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] items-end">
                <div className="flex flex-col gap-1">
                  <FieldLabel>Name</FieldLabel>
                  <input
                    className={inputClass}
                    value={site.name}
                    onChange={(e) => updateCompany(index, "name", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel>Web Address</FieldLabel>
                  <input
                    className={inputClass}
                    value={site.url}
                    onChange={(e) => updateCompany(index, "url", e.target.value)}
                  />
                </div>
                <button className={deleteBtnClass} type="button" onClick={() => removeCompany(index)}>
                  Delete
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-1">
                <FieldLabel>RSS Feed URL (optional)</FieldLabel>
                <input
                  className={inputClass}
                  value={site.rss_url || ""}
                  placeholder="https://example.com/feed.xml"
                  onChange={(e) => updateCompany(index, "rss_url", e.target.value)}
                />
              </div>
              <div className="mt-3">
                <FieldLabel>Feeds into</FieldLabel>
                <div className="mt-2 flex flex-wrap gap-3">
                  {Object.entries(STREAM_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-accent"
                        checked={(site.category_tags || []).includes(key)}
                        onChange={(e) => updateCompanyCategoryTags(index, key, e.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <form className="mt-4 space-y-3" onSubmit={addCompany}>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <FieldLabel>Name</FieldLabel>
              <input className={inputClass} placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Web Address</FieldLabel>
              <input className={inputClass} placeholder="https://company.com/news" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>RSS Feed URL (optional)</FieldLabel>
              <input className={inputClass} placeholder="https://company.com/feed.xml" value={companyRssUrl} onChange={(e) => setCompanyRssUrl(e.target.value)} />
            </div>
          </div>
          <button className="rounded bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white" type="submit">
            Add company
          </button>
        </form>
      </section>

      {/* Thought Leaders */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Thought Leaders</h3>
        <p className="mt-1 text-sm text-slate-500">
          The pipeline searches for recent commentary and writing from these individuals via web
          search.
        </p>
        <ul className="mt-4 space-y-4">
          {thoughtLeaders.map((person, index) => (
            <li key={`${person.name}-${person.url || ""}-${index}`} className="rounded-lg border border-slate-100 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] items-end">
                <div className="flex flex-col gap-1">
                  <FieldLabel>Name</FieldLabel>
                  <input
                    className={inputClass}
                    value={person.name}
                    onChange={(e) => updateLeader(index, "name", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel>Website / Profile URL</FieldLabel>
                  <input
                    className={inputClass}
                    value={person.url || ""}
                    onChange={(e) => updateLeader(index, "url", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel>Notes</FieldLabel>
                  <input
                    className={inputClass}
                    value={person.note || ""}
                    onChange={(e) => updateLeader(index, "note", e.target.value)}
                  />
                </div>
                <button className={deleteBtnClass} type="button" onClick={() => removeLeader(index)}>
                  Delete
                </button>
              </div>
              <div className="mt-3">
                <FieldLabel>Feeds into</FieldLabel>
                <div className="mt-2 flex flex-wrap gap-3">
                  {Object.entries(STREAM_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-accent"
                        checked={(person.category_tags || []).includes(key)}
                        onChange={(e) => updateLeaderCategoryTags(index, key, e.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <form className="mt-4 space-y-3" onSubmit={addLeader}>
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <FieldLabel>Name</FieldLabel>
              <input className={inputClass} placeholder="Full name" value={leaderName} onChange={(e) => setLeaderName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Website / Profile URL</FieldLabel>
              <input className={inputClass} placeholder="https://theirsite.com" value={leaderUrl} onChange={(e) => setLeaderUrl(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Notes (optional)</FieldLabel>
              <input className={inputClass} placeholder="What they cover" value={leaderNote} onChange={(e) => setLeaderNote(e.target.value)} />
            </div>
            <button className="self-end rounded bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white" type="submit">
              Add leader
            </button>
          </div>
        </form>
      </section>

      {/* Search Terms */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Search Terms</h3>
        <p className="mt-1 text-sm text-slate-500">
          Additional keyword queries run via web search to surface articles not covered by fixed
          sources.
        </p>
        <ul className="mt-4 space-y-3">
          {searchTerms.map((term, index) => (
            <li key={`${term.term}-${index}`} className="rounded-lg border border-slate-100 p-3">
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto] items-end">
                <div className="flex flex-col gap-1">
                  <FieldLabel>Search query</FieldLabel>
                  <input
                    className={inputClass}
                    value={term.term}
                    onChange={(e) => updateSearchTerm(index, e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel>Category</FieldLabel>
                  <select
                    className={selectClass}
                    value={term.category_tag}
                    onChange={(e) => updateSearchTermCategory(index, e.target.value)}
                  >
                    {Object.entries(STREAM_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <button className={deleteBtnClass} type="button" onClick={() => removeSearchTerm(index)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form className="mt-4 space-y-3" onSubmit={addSearchTerm}>
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto] items-end">
            <div className="flex flex-col gap-1">
              <FieldLabel>Search query</FieldLabel>
              <input className={inputClass} placeholder="e.g. frontier model release" value={searchTermValue} onChange={(e) => setSearchTermValue(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Category</FieldLabel>
              <select className={selectClass} value={searchTermCategory} onChange={(e) => setSearchTermCategory(e.target.value)}>
                {Object.entries(STREAM_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <button className="self-end rounded bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white" type="submit">
              Add term
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
