import { type Prisma } from "@prisma/client";

import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
  type UpdatePageMetadataInput,
  PageSlug,
} from "@repo/contracts/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { getPageSectionsOrder } from "../../utils/page-sections";

const isValidPageSlug = (slug: string): slug is PageSlug => {
  return Object.values(PageSlug).includes(slug as PageSlug);
};

export const adminPagesApi = {
  getPages: async (): Promise<AdminPageListItem[]> => {
    const pages = await prisma.marketingPage.findMany({
      orderBy: { slug: "asc" },
    });

    return pages
      .filter((p) => isValidPageSlug(p.slug))
      .map((p) => ({
        id: p.id,
        slug: p.slug as PageSlug,
        title: p.title,
        updatedAt: p.updatedAt,
      }));
  },

  getPageBySlug: async (slug: string): Promise<AdminPageDetails> => {
    const page = await prisma.marketingPage.findUnique({
      where: { slug },
      include: {
        sections: true,
      },
    });

    if (!page) {
      throw new NotFoundError(`Page with slug ${slug} not found`);
    }

    if (!isValidPageSlug(page.slug)) {
      throw new NotFoundError(`Invalid page slug: ${slug}`);
    }

    const sectionsOrder = getPageSectionsOrder(page.slug);
    const sortedSections = [...page.sections].sort((a, b) => {
      const aIndex = sectionsOrder.indexOf(a.section);
      const bIndex = sectionsOrder.indexOf(b.section);

      return aIndex - bIndex;
    });

    return {
      slug: page.slug,
      sections: sortedSections.map((s) => ({
        id: s.id,
        section: s.section,
        data: s.data as Record<string, unknown>,
        updatedAt: s.updatedAt,
      })),
    };
  },

  updatePageMetadata: async (slug: string, payload: UpdatePageMetadataInput): Promise<void> => {
    await prisma.marketingPage.update({
      where: { slug },
      data: payload,
    });
  },

  updateSection: async (payload: UpdatePageSectionData): Promise<void> => {
    const existing = await prisma.marketingPageSection.findUnique({
      where: {
        pageSlug_section: {
          pageSlug: payload.pageSlug,
          section: payload.section,
        },
      },
    });

    if (!existing) {
      throw new NotFoundError(`Section ${payload.section} for page ${payload.pageSlug} not found`);
    }

    await prisma.marketingPageSection.update({
      where: { id: existing.id },
      data: {
        data: payload.data as Prisma.InputJsonValue,
      },
    });
  },
};
