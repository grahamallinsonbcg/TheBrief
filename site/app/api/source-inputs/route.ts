import { readFile, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const runtimePath = path.join(process.cwd(), "public", "config", "source_inputs.runtime.json");

function isValidPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  return (
    Array.isArray(record.trusted_sites) &&
    Array.isArray(record.individuals) &&
    Array.isArray(record.search_terms)
  );
}

export async function GET() {
  try {
    const raw = await readFile(runtimePath, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(
      { error: "Runtime source inputs not found." },
      { status: 404 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requiredToken = process.env.SOURCE_CONFIG_ADMIN_TOKEN;
  const providedToken = request.headers.get("x-admin-token");
  if (!requiredToken || providedToken !== requiredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: "Invalid source input schema." }, { status: 400 });
  }

  await writeFile(runtimePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return NextResponse.json({ ok: true });
}
