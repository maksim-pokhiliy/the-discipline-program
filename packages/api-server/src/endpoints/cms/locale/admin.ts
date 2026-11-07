import { Prisma } from "@prisma/client";

import {
  type AdminLocaleListItem,
  type CreateLocaleData,
  DEFAULT_LOCALE_CODE,
  type Locale,
  type LocaleCode,
  type ReorderLocalesData,
  type UpdateLocaleData,
} from "@repo/contracts/cms/locale";
import { BadRequestError, ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { TX_BUDGET_DEFAULT } from "../../../db/transaction-config";
import { mapToLocale } from "../../../mappers/cms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { EMPTY_SECTION_DATA } from "../pages/page-sections";

import { isCatalogPermutation } from "./catalog-permutation";
import { assertAdminLocale, ensureDefaultLocale, LOCALE_ORDER } from "./locale-access";
import { lockLocaleOrder } from "./locale-order-lock";
import { countServedSections } from "./translation-progress";

const translatedSectionsWhere = (code: LocaleCode): Prisma.MarketingPageSectionWhereInput => ({
  locale: code,
  NOT: { data: { equals: EMPTY_SECTION_DATA } },
});

const listLocales = async (): Promise<AdminLocaleListItem[]> => {
  await ensureDefaultLocale();

  const [locales, sectionRows] = await Promise.all([
    prisma.marketingLocale.findMany({ orderBy: LOCALE_ORDER }),
    prisma.marketingPageSection.findMany({
      where: { isActive: true },
      select: { locale: true, pageSlug: true, section: true, data: true },
    }),
  ]);
  const servedCounts = countServedSections(sectionRows);

  return locales.map((locale) => ({
    ...mapToLocale(locale),
    translatedSectionCount: servedCounts.get(locale.code) ?? 0,
  }));
};

export const cmsLocaleAdminApi = {
  getLocales: listLocales,

  createLocale: async (data: CreateLocaleData): Promise<Locale> => {
    await ensureDefaultLocale();

    try {
      const locale = await prisma.$transaction(async (tx) => {
        await lockLocaleOrder(tx);

        const sortOrder = await tx.marketingLocale.count();

        return tx.marketingLocale.create({
          data: { code: data.code, name: data.name, isEnabled: false, sortOrder },
        });
      }, TX_BUDGET_DEFAULT);

      return mapToLocale(locale);
    } catch (error) {
      return handlePrismaError(error, { entity: "Locale", field: "code" });
    }
  },

  updateLocale: async (code: LocaleCode, data: UpdateLocaleData): Promise<Locale> => {
    if (code === DEFAULT_LOCALE_CODE && data.isEnabled === false) {
      throw new BadRequestError("The default locale cannot be disabled", { code });
    }

    await assertAdminLocale(code);

    try {
      const locale = await prisma.marketingLocale.update({
        where: { code },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
        },
      });

      return mapToLocale(locale);
    } catch (error) {
      return handlePrismaError(error, { entity: "Locale", field: "code" });
    }
  },

  reorderLocales: async ({ orderedCodes }: ReorderLocalesData): Promise<AdminLocaleListItem[]> => {
    try {
      await prisma.$transaction(async (tx) => {
        await lockLocaleOrder(tx);

        const catalog = await tx.marketingLocale.findMany({
          where: { code: { not: DEFAULT_LOCALE_CODE } },
          select: { code: true },
        });

        if (
          !isCatalogPermutation(
            catalog.map(({ code }) => code),
            orderedCodes,
          )
        ) {
          throw new ConflictError(
            "The languages have changed since this list was loaded; reload it and try again",
          );
        }

        for (const [index, code] of orderedCodes.entries()) {
          await tx.marketingLocale.update({ where: { code }, data: { sortOrder: index + 1 } });
        }
      }, TX_BUDGET_DEFAULT);

      return await listLocales();
    } catch (error) {
      return handlePrismaError(error, { entity: "Locale", field: "code" });
    }
  },

  deleteLocale: async (code: LocaleCode): Promise<void> => {
    if (code === DEFAULT_LOCALE_CODE) {
      throw new BadRequestError("The default locale cannot be deleted", { code });
    }

    await findOrThrow(prisma.marketingLocale.findUnique({ where: { code } }), "Locale");

    const translatedSectionCount = await prisma.marketingPageSection.count({
      where: translatedSectionsWhere(code),
    });

    if (translatedSectionCount > 0) {
      throw new ConflictError(
        `Locale ${code} has ${translatedSectionCount} translated section(s); clear them or disable the locale instead`,
        { code, translatedSectionCount },
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        await lockLocaleOrder(tx);
        await tx.marketingPageSection.deleteMany({
          where: { locale: code, data: { equals: EMPTY_SECTION_DATA } },
        });

        const removed = await tx.marketingLocale.delete({ where: { code } });

        await tx.marketingLocale.updateMany({
          where: { sortOrder: { gt: removed.sortOrder } },
          data: { sortOrder: { decrement: 1 } },
        });
      }, TX_BUDGET_DEFAULT);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictError(
          `Locale ${code} received new section rows while it was being deleted; try again`,
          { code },
        );
      }

      return handlePrismaError(error, { entity: "Locale", field: "code" });
    }
  },
};
