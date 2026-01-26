import { type Prisma } from "@prisma/client";

import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
  updatePageSectionSchema,
} from "@repo/contracts/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

export const adminPagesApi = {
  getPages: async (): Promise<AdminPageListItem[]> => {
    const pages = await prisma.marketingPageSection.groupBy({
      by: ["pageSlug"],
      _max: {
        updatedAt: true,
      },
    });

    return pages.map((p) => ({
      id: p.pageSlug,
      slug: p.pageSlug as AdminPageListItem["slug"],
      updatedAt: p._max.updatedAt ?? new Date(),
    }));
  },

  getPageBySlug: async (slug: string): Promise<AdminPageDetails> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: slug },
      orderBy: { section: "asc" },
    });

    if (sections.length === 0) {
      throw new NotFoundError(`Page with slug ${slug} not found`);
    }

    return {
      slug: slug as AdminPageDetails["slug"],
      sections: sections.map((s) => ({
        id: s.id,
        section: s.section,
        data: s.data as Record<string, unknown>,
        updatedAt: s.updatedAt,
      })),
    };
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
