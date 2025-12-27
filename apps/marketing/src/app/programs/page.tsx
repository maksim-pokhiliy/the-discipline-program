import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";
import { Metadata } from "next";

export { ProgramsPage as default } from "@app/modules/programs";

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
