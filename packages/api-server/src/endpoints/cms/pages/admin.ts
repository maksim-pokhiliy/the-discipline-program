import { type MarketingPageSection, Prisma } from "@prisma/client";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
  adminPageDetailsSchema,
  PageSlug,
  SECTION_FIELD_KINDS,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";
import { BadRequestError, NotFoundError } from "@repo/errors";
import { capitalize } from "@repo/shared";

import { prisma } from "../../../db/client";
import { TX_BUDGET_DEFAULT } from "../../../db/transaction-config";
import { type TxClient } from "../../../db/tx";
import { handlePrismaError } from "../../../utils";
import { assertAdminLocale, ensureDefaultLocale } from "../locale/locale-access";
import { countServedSectionsByPage } from "../locale/translation-progress";

import {
  getPageSectionsOrder,
  isSectionOfPage,
  lockPageSection,
  readableSectionData,
  scaffoldSectionData,
  sectionTranslationState,
} from "./page-sections";
import {
  composeTranslatedSection,
  type ComposedSection,
  overlayWords,
} from "./section-translation";

const PAGE_SLUGS: ReadonlySet<string> = new Set(Object.values(PageSlug));
const isValidPageSlug = (slug: string): slug is PageSlug => PAGE_SLUGS.has(slug);

const ensurePages = async (slugs: readonly PageSlug[]): Promise<void> => {
  await prisma.marketingPage.createMany({
    data: slugs.map((slug) => ({ slug, title: capitalize(slug) })),
    skipDuplicates: true,
  });
};

const handleSectionWriteError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    throw new NotFoundError("Locale not found");
  }

  return handlePrismaError(error, { entity: "Page section" });
};

const ensurePageScaffold = async (
  slug: PageSlug,
  locales: readonly LocaleCode[],
): Promise<void> => {
  await ensurePages([slug]);

  try {
    await prisma.marketingPageSection.createMany({
      data: locales.flatMap((locale) =>
        getPageSectionsOrder(slug).map((section) => ({
          pageSlug: slug,
          section,
          locale,
          data: scaffoldSectionData(section, locale),
        })),
      ),
      skipDuplicates: true,
    });
  } catch (error) {
    return handleSectionWriteError(error);
  }
};

const toAdminSection = (
  section: SectionSchemaKey,
  row: MarketingPageSection,
  englishRow: MarketingPageSection | undefined,
) => {
  const own = readableSectionData(section, row.data);
  const base = {
    id: row.id,
    section,
    updatedAt: row.updatedAt.toISOString(),
    hasUnreadableData: !own.isReadable,
  };

  if (!englishRow) {
    return { ...base, data: own.data, translation: null };
  }

  const english = readableSectionData(section, englishRow.data);

  return {
    ...base,
    data: overlayWords(SECTION_FIELD_KINDS[section], english.data, own.data),
    translation: {
      state: sectionTranslationState(row, englishRow.updatedAt),
      english: { data: english.data, updatedAt: englishRow.updatedAt.toISOString() },
    },
  };
};

const composeFromEnglish = async (
  tx: TxClient,
  payload: UpdatePageSectionData,
): Promise<ComposedSection> => {
  const where = {
    pageSlug: payload.pageSlug,
    section: payload.section,
    locale: DEFAULT_LOCALE_CODE,
  };

  await tx.marketingPageSection.createMany({
    data: [{ ...where, data: scaffoldSectionData(payload.section, DEFAULT_LOCALE_CODE) }],
    skipDuplicates: true,
  });

  const english = await tx.marketingPageSection.findUnique({
    where: { pageSlug_section_locale: where },
    select: { data: true },
  });

  return composeTranslatedSection(
    payload.section,
    readableSectionData(payload.section, english?.data ?? null).data,
    payload.data,
  );
};

export const cmsPagesAdminApi = {
  getPages: async (locale: LocaleCode = DEFAULT_LOCALE_CODE): Promise<AdminPageListItem[]> => {
    const isDefaultLocale = locale === DEFAULT_LOCALE_CODE;

    if (!isDefaultLocale) {
      await assertAdminLocale(locale);
    }

    await ensurePages(Object.values(PageSlug));

    const [pages, sectionRows] = await Promise.all([
      prisma.marketingPage.findMany({ orderBy: { slug: "asc" } }),
      isDefaultLocale
        ? []
        : prisma.marketingPageSection.findMany({
            where: { locale, isActive: true },
            select: { pageSlug: true, section: true, data: true },
          }),
    ]);
    const counts = countServedSectionsByPage(sectionRows);

    return pages
      .filter((p): p is typeof p & { slug: PageSlug } => isValidPageSlug(p.slug))
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        updatedAt: p.updatedAt,
        translatedSectionCount: isDefaultLocale ? null : (counts.get(p.slug) ?? 0),
      }));
  },

  getPageBySlug: async (
    slug: string,
    locale: LocaleCode = DEFAULT_LOCALE_CODE,
  ): Promise<AdminPageDetails> => {
    if (!isValidPageSlug(slug)) {
      throw new NotFoundError(`Page with slug ${slug} not found`);
    }

    const isDefaultLocale = locale === DEFAULT_LOCALE_CODE;

    await assertAdminLocale(locale);

    if (!isDefaultLocale) {
      await ensureDefaultLocale();
    }

    const locales = isDefaultLocale ? [DEFAULT_LOCALE_CODE] : [DEFAULT_LOCALE_CODE, locale];

    await ensurePageScaffold(slug, locales);

    const rows = await prisma.marketingPageSection.findMany({
      where: { pageSlug: slug, locale: { in: locales } },
    });
    const sections = getPageSectionsOrder(slug).flatMap((section) => {
      const ownRow = rows.find((row) => row.section === section && row.locale === locale);
      const englishRow = rows.find(
        (row) => row.section === section && row.locale === DEFAULT_LOCALE_CODE,
      );

      if (!isSectionOfPage(slug, section) || !ownRow || (!isDefaultLocale && !englishRow)) {
        return [];
      }

      return [toAdminSection(section, ownRow, isDefaultLocale ? undefined : englishRow)];
    });

    return adminPageDetailsSchema.parse({ slug, locale, sections });
  },

  updateSection: async (payload: UpdatePageSectionData): Promise<void> => {
    const locale = payload.locale ?? DEFAULT_LOCALE_CODE;
    const isDefaultLocale = locale === DEFAULT_LOCALE_CODE;

    if (!isSectionOfPage(payload.pageSlug, payload.section)) {
      throw new NotFoundError(`Section ${payload.section} for page ${payload.pageSlug} not found`);
    }

    if (isDefaultLocale && Object.keys(payload.data).length === 0) {
      throw new BadRequestError("An English section cannot be saved empty", {
        section: payload.section,
      });
    }

    await assertAdminLocale(locale);

    if (!isDefaultLocale) {
      await ensureDefaultLocale();
    }

    await ensurePages([payload.pageSlug]);

    try {
      await prisma.$transaction(async (tx) => {
        await lockPageSection(tx, payload.pageSlug, payload.section);

        const row = isDefaultLocale
          ? { data: structuredClone(payload.data), isActive: true }
          : await composeFromEnglish(tx, payload);
        const where = { pageSlug: payload.pageSlug, section: payload.section, locale };

        await tx.marketingPageSection.upsert({
          where: { pageSlug_section_locale: where },
          create: { ...where, ...row },
          update: row,
        });
      }, TX_BUDGET_DEFAULT);
    } catch (error) {
      return handleSectionWriteError(error);
    }
  },
};
