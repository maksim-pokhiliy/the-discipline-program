import { Metadata } from "next";

import { ProgramsPage } from "@app/modules/programs";
import { PAGE_SEO, SEO_CONFIG } from "@app/shared/constants";

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

export default ProgramsPage;
