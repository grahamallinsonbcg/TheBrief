"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SourceSnapshot } from "@/lib/types";

type Props = {
  initialSnapshot: SourceSnapshot;
};

const STORAGE_KEY = "thebrief.sources.editor.v1";

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

export function SourcesEditor({ initialSnapshot }: Props) {
  const stored = loadStoredSnapshot(initialSnapshot);
  const [companies, setCompanies] = useState(stored.trusted_sites);
  const [thoughtLeaders, setThoughtLeaders] = useState(stored.individuals);
  const [searchTerms, setSearchTerms] = useState(stored.search_terms);

  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderUrl, setLeaderUrl] = useState("");
  const [leaderNote, setLeaderNote] = useState("");
  const [searchTermValue, setSearchTermValue] = useState("");
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
        domain,
        category_tags: ["ai-trends-news"],
      },
    ]);
    setCompanyName("");
    setCompanyUrl("");
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
      { term: searchTermValue.trim(), category_tag: "ai-trends-news" },
    ]);
    setSearchTermValue("");
  };

  const updateCompany = (index: number, field: "name" | "url", value: string) => {
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

  const removeCompany = (index: number) => {
    setCompanies((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLeader = (index: number, field: "name" | "url" | "note", value: string) => {
    setThoughtLeaders((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeLeader = (index: number) => {
    setThoughtLeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSearchTerm = (index: number, value: string) => {
    setSearchTerms((prev) => prev.map((item, i) => (i === index ? { ...item, term: value } : item)));
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
        rss_url: "",
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

  return (
    <>
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">How this works</h2>
        <p className="mt-2 text-sm text-slate-600">
          Configuration is centrally managed for quality control. Added entries are saved in your browser and can be
          copied into admin config for pipeline use.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Snapshot updated: {new Date(initialSnapshot.last_updated_utc).toLocaleString()} · Local edits: {today}
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

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Companies</h3>
        <ul className="mt-3 space-y-2">
          {companies.map((site, index) => (
            <li key={`${site.name}-${site.url}-${index}`} className="rounded-lg border border-slate-100 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <input
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                  value={site.name}
                  onChange={(e) => updateCompany(index, "name", e.target.value)}
                />
                <input
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                  value={site.url}
                  onChange={(e) => updateCompany(index, "url", e.target.value)}
                />
                <button
                  className="rounded border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-red-600"
                  type="button"
                  onClick={() => removeCompany(index)}
                >
                  Delete
                </button>
              </div>
              <a href={site.url} className="mt-2 inline-block text-sm text-accent hover:text-accent-dark" target="_blank" rel="noreferrer">
                {site.url}
              </a>
            </li>
          ))}
        </ul>
        <form className="mt-4 grid gap-2 sm:grid-cols-3" onSubmit={addCompany}>
          <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="https://company.com/news" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} />
          <button className="rounded bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white" type="submit">Add company</button>
        </form>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Thought Leaders</h3>
        <ul className="mt-3 space-y-2">
          {thoughtLeaders.map((person, index) => (
            <li key={`${person.name}-${person.url || ""}-${index}`} className="rounded-lg border border-slate-100 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                  value={person.name}
                  onChange={(e) => updateLeader(index, "name", e.target.value)}
                />
                <input
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                  value={person.url || ""}
                  onChange={(e) => updateLeader(index, "url", e.target.value)}
                />
                <input
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                  value={person.note || ""}
                  onChange={(e) => updateLeader(index, "note", e.target.value)}
                />
                <button
                  className="rounded border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-red-600"
                  type="button"
                  onClick={() => removeLeader(index)}
                >
                  Delete
                </button>
              </div>
              {person.url && (
                <a href={person.url} className="mt-2 inline-block text-sm text-accent hover:text-accent-dark" target="_blank" rel="noreferrer">
                  {person.url}
                </a>
              )}
            </li>
          ))}
        </ul>
        <form className="mt-4 grid gap-2 sm:grid-cols-4" onSubmit={addLeader}>
          <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Name" value={leaderName} onChange={(e) => setLeaderName(e.target.value)} />
          <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="https://profile-or-site.com" value={leaderUrl} onChange={(e) => setLeaderUrl(e.target.value)} />
          <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Short note (optional)" value={leaderNote} onChange={(e) => setLeaderNote(e.target.value)} />
          <button className="rounded bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white" type="submit">Add leader</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Search Terms</h3>
        <ul className="mt-3 space-y-2">
          {searchTerms.map((term, index) => (
            <li key={`${term.term}-${index}`} className="rounded-lg border border-slate-100 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                  value={term.term}
                  onChange={(e) => updateSearchTerm(index, e.target.value)}
                />
                <button
                  className="rounded border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-red-600"
                  type="button"
                  onClick={() => removeSearchTerm(index)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={addSearchTerm}>
          <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="New search term" value={searchTermValue} onChange={(e) => setSearchTermValue(e.target.value)} />
          <button className="rounded bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white" type="submit">Add term</button>
        </form>
      </section>
    </>
  );
}
