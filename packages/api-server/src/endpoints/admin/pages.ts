import { type Prisma } from "@prisma/client";

import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
  type UpdatePageMetadataInput,
  updatePageSectionSchema,
  updatePageMetadataSchema,
  PAGE_SLUGS,
  getPageSectionsOrder,
} from "@repo/contracts/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

type PageSlug = (typeof PAGE_SLUGS)[number];

const isValidPageSlug = (slug: string): slug is PageSlug => {
  return PAGE_SLUGS.includes(slug as PageSlug);
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
    const validated = updatePageMetadataSchema.parse(payload);

    await prisma.marketingPage.update({
      where: { slug },
      data: validated,
    });
  },

  updateSection: async (payload: UpdatePageSectionData): Promise<void> => {
    const validated = updatePageSectionSchema.parse(payload);

    const existing = await prisma.marketingPageSection.findUnique({
      where: {
        pageSlug_section: {
          pageSlug: validated.pageSlug,
          section: validated.section,
        },
      },
    });

    if (!existing) {
      throw new NotFoundError(
        `Section ${validated.section} for page ${validated.pageSlug} not found`,
      );
    }

    await prisma.marketingPageSection.update({
      where: { id: existing.id },
      data: {
        data: validated.data as Prisma.InputJsonValue,
      },
    });
  },
};
