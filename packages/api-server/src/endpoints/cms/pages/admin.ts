import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
  type UpdatePageMetadataInput,
  PageSlug,
  SECTION_SCHEMAS,
} from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";
import { capitalize } from "@repo/shared";

import { prisma } from "../../../db/client";
import { handlePrismaError } from "../../../utils";
import { asJsonRecord } from "../../../utils/json-record";

import { getPageSectionsOrder } from "./page-sections";

const PAGE_SLUGS: ReadonlySet<string> = new Set(Object.values(PageSlug));
const SECTION_KEYS: ReadonlySet<string> = new Set(Object.keys(SECTION_SCHEMAS));

type SectionKey = keyof typeof SECTION_SCHEMAS;

const isValidPageSlug = (slug: string): slug is PageSlug => PAGE_SLUGS.has(slug);
const isValidSectionKey = (key: string): key is SectionKey => SECTION_KEYS.has(key);

const ensurePages = async (slugs: readonly PageSlug[]): Promise<void> => {
  await prisma.marketingPage.createMany({
    data: slugs.map((slug) => ({ slug, title: capitalize(slug) })),
    skipDuplicates: true,
  });
};

const ensurePageScaffold = async (slug: PageSlug): Promise<void> => {
  await ensurePages([slug]);

  await prisma.marketingPageSection.createMany({
    data: getPageSectionsOrder(slug).map((section) => ({ pageSlug: slug, section, data: {} })),
    skipDuplicates: true,
  });
};

export const cmsPagesAdminApi = {
  getPages: async (): Promise<AdminPageListItem[]> => {
    await ensurePages(Object.values(PageSlug));

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
    if (!isValidPageSlug(slug)) {
      throw new NotFoundError(`Page with slug ${slug} not found`);
    }

    await ensurePageScaffold(slug);

    const page = await prisma.marketingPage.findUnique({
      where: { slug },
      include: {
        sections: true,
      },
    });

    if (!page) {
      throw new NotFoundError(`Page with slug ${slug} not found`);
    }

    const sectionsOrder = getPageSectionsOrder(slug);
    const sortedSections = [...page.sections].sort((a, b) => {
      const aIndex = sectionsOrder.indexOf(a.section);
      const bIndex = sectionsOrder.indexOf(b.section);

      return aIndex - bIndex;
    });

    return {
      slug,
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
    if (!isValidPageSlug(slug)) {
      throw new NotFoundError(`Page with slug ${slug} not found`);
    }

    try {
      await prisma.marketingPage.upsert({
        where: { slug },
        create: {
          slug,
          title: payload.title,
          seoTitle: payload.seoTitle ?? null,
          seoDesc: payload.seoDesc ?? null,
        },
        update: {
          title: payload.title,
          ...(payload.seoTitle !== undefined && { seoTitle: payload.seoTitle }),
          ...(payload.seoDesc !== undefined && { seoDesc: payload.seoDesc }),
        },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Page", field: "slug" });
    }
  },

  updateSection: async (payload: UpdatePageSectionData): Promise<void> => {
    if (!getPageSectionsOrder(payload.pageSlug).includes(payload.section)) {
      throw new NotFoundError(`Section ${payload.section} for page ${payload.pageSlug} not found`);
    }

    await ensurePages([payload.pageSlug]);

    try {
      await prisma.marketingPageSection.upsert({
        where: {
          pageSlug_section: {
            pageSlug: payload.pageSlug,
            section: payload.section,
          },
        },
        create: {
          pageSlug: payload.pageSlug,
          section: payload.section,
          data: structuredClone(payload.data),
        },
        update: {
          data: structuredClone(payload.data),
        },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Page section" });
    }
  },
};
