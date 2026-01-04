import { type Metadata } from "next";

import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";

import { api } from "@app/lib/api";
import { ProgramsPageClient } from "@app/modules/programs";

export const metadata: Metadata = {
  title: PAGE_SEO.programs.title,
  description: PAGE_SEO.programs.description,
  keywords: PAGE_SEO.programs.keywords,
  openGraph: {
    title: PAGE_SEO.programs.title,
    description: PAGE_SEO.programs.description,
    url: `${SEO_CONFIG.siteUrl}/programs`,
  },
};

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const initialData = await api.pages.getPrograms();

  return <ProgramsPageClient initialData={initialData} />;
}
