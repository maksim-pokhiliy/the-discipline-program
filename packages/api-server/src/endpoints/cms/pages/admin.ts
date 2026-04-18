import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
  type UpdatePageMetadataInput,
  PageSlug,
  SECTION_SCHEMAS,
} from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { handlePrismaError } from "../../../utils";
import { asJsonRecord } from "../../../utils/json-record";

import { getPageSectionsOrder } from "./page-sections";

const PAGE_SLUGS: ReadonlySet<string> = new Set(Object.values(PageSlug));
const SECTION_KEYS: ReadonlySet<string> = new Set(Object.keys(SECTION_SCHEMAS));

type SectionKey = keyof typeof SECTION_SCHEMAS;

const isValidPageSlug = (slug: string): slug is PageSlug => PAGE_SLUGS.has(slug);
const isValidSectionKey = (key: string): key is SectionKey => SECTION_KEYS.has(key);

export const cmsPagesAdminApi = {
  getPages: async (): Promise<AdminPageListItem[]> => {
    const pages = await prisma.marketingPage.findMany({
      orderBy: { slug: "asc" },
    });

    return pages
      .filter((p): p is typeof p & { slug: PageSlug } => isValidPageSlug(p.slug))
      .map((p) => ({
        id: p.id,
        slug: p.slug,
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
      sections: sortedSections
        .filter((s): s is typeof s & { section: SectionKey } => isValidSectionKey(s.section))
        .map((s) => ({
          id: s.id,
          section: s.section,
          data: SECTION_SCHEMAS[s.section].partial().parse(asJsonRecord(s.data) ?? {}),
          updatedAt: s.updatedAt,
        })),
    };
  },

  updatePageMetadata: async (slug: string, payload: UpdatePageMetadataInput): Promise<void> => {
    try {
      await prisma.marketingPage.update({
        where: { slug },
        data: payload,
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Page", field: "slug" });
    }
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

    try {
      await prisma.marketingPageSection.update({
        where: { id: existing.id },
        data: {
          data: structuredClone(payload.data),
        },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Page section" });
    }
  },
};
