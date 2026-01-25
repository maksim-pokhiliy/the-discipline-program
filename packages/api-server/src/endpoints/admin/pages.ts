import { type Prisma, type MarketingPageSection } from "@prisma/client";
import { type z } from "zod";

import { PAGE_SLUGS } from "@repo/contracts/pages";
import {
  type PageListItemDto,
  type PageSectionDto,
  PAGES_REGISTRY,
  type PageSlug,
} from "@repo/contracts/pages";

import { prisma } from "../../db/client";

function isValidPageSlug(slug: string): slug is PageSlug {
  return slug in PAGES_REGISTRY;
}

export const adminPagesApi = {
  getPages: async (): Promise<PageListItemDto[]> => {
    return PAGE_SLUGS.map((slug) => ({
      slug,
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
    }));
  },

  getPageSections: async (pageSlug: string): Promise<PageSectionDto[]> => {
    return prisma.marketingPageSection.findMany({
      where: { pageSlug },
    });
  },

  updateSection: async (
    pageSlug: string,
    section: string,
    rawData: unknown,
  ): Promise<MarketingPageSection> => {
    if (!isValidPageSlug(pageSlug)) {
      throw new Error(`Invalid page slug: ${pageSlug}`);
    }

    const pageConfig = PAGES_REGISTRY[pageSlug];

    if (!(section in pageConfig)) {
      throw new Error(`Invalid section "${section}" for page "${pageSlug}"`);
    }

    const schema = pageConfig[
      section as keyof typeof pageConfig
    ] as z.ZodType<Prisma.InputJsonValue>;

    const validData = schema.parse(rawData);

    return prisma.marketingPageSection.upsert({
      where: {
        pageSlug_section: {
          pageSlug,
          section,
        },
      },
      update: {
        data: validData,
      },
      create: {
        pageSlug,
        section,
        data: validData,
      },
    });
  },
};
