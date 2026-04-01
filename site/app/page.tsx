import { redirect } from "next/navigation";
import { getEditionManifest } from "@/lib/editions";

export default async function HomePage() {
  const manifest = await getEditionManifest();
  redirect(`/edition/${manifest.latest}`);
}
