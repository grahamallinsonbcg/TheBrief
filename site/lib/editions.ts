import { readFile } from "fs/promises";
import path from "path";
import { BriefEdition, EditionManifest } from "./types";

const editionsDir = path.join(process.cwd(), "public", "editions");

export async function getEditionManifest(): Promise<EditionManifest> {
  const manifestPath = path.join(editionsDir, "index.json");
  const raw = await readFile(manifestPath, "utf8");
  try {
    return JSON.parse(raw) as EditionManifest;
  } catch {
    throw new Error(`Failed to parse edition manifest: ${manifestPath}`);
  }
}

export async function getEditionBySlug(slug: string): Promise<BriefEdition> {
  const editionPath = path.join(editionsDir, `${slug}.json`);
  const raw = await readFile(editionPath, "utf8");
  try {
    return JSON.parse(raw) as BriefEdition;
  } catch {
    throw new Error(`Failed to parse edition file: ${editionPath}`);
  }
}
