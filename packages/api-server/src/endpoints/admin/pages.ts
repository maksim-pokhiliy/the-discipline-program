import { type MarketingPageSection } from "@prisma/client";

import { PAGE_SLUGS } from "@repo/contracts/pages";

import { prisma } from "../../db/client";

export const adminPagesApi = {
  getPages: async () => {
    return PAGE_SLUGS.map((slug) => ({
      slug,
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
    }));
  },

  getPageSections: async (pageSlug: string): Promise<MarketingPageSection[]> => {
    return prisma.marketingPageSection.findMany({
      where: { pageSlug },
    });
  },

  updateSection: async (
    pageSlug: string,
    section: string,
    data: object,
  ): Promise<MarketingPageSection> => {
    return prisma.marketingPageSection.upsert({
      where: {
        pageSlug_section: {
          pageSlug,
          section,
        },
      },
      update: {
        data,
      },
      create: {
        pageSlug,
        section,
        data,
      },
    });
  },
};
