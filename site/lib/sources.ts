import { readFile } from "fs/promises";
import path from "path";
import { SourceSnapshot } from "./types";

const snapshotPath = path.join(process.cwd(), "public", "config", "sources.public.json");

export async function getSourceSnapshot(): Promise<SourceSnapshot> {
  try {
    const raw = await readFile(snapshotPath, "utf8");
    return JSON.parse(raw) as SourceSnapshot;
  } catch {
    return {
      last_updated_utc: new Date(0).toISOString(),
      applies_to: "next edition",
      note: "Configuration is centrally managed for quality control.",
      trusted_sites: [],
      individuals: [],
      search_terms: [],
    };
  }
}
