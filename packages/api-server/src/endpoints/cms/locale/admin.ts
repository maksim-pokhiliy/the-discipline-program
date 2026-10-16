import { Prisma } from "@prisma/client";

import {
  type CreateLocaleData,
  DEFAULT_LOCALE_CODE,
  type Locale,
  type LocaleCode,
  type UpdateLocaleData,
} from "@repo/contracts/cms/locale";
import { BadRequestError, ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToLocale } from "../../../mappers/cms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { EMPTY_SECTION_DATA } from "../pages/page-sections";

import { assertAdminLocale, ensureDefaultLocale, LOCALE_ORDER } from "./locale-access";

const translatedSectionsWhere = (code: LocaleCode): Prisma.MarketingPageSectionWhereInput => ({
  locale: code,
  NOT: { data: { equals: EMPTY_SECTION_DATA } },
});

export const cmsLocaleAdminApi = {
  getLocales: async (): Promise<Locale[]> => {
    await ensureDefaultLocale();

    const locales = await prisma.marketingLocale.findMany({ orderBy: LOCALE_ORDER });

    return locales.map(mapToLocale);
  },

  createLocale: async (data: CreateLocaleData): Promise<Locale> => {
    await ensureDefaultLocale();

    const { _max } = await prisma.marketingLocale.aggregate({ _max: { sortOrder: true } });

    try {
      const locale = await prisma.marketingLocale.create({
        data: {
          code: data.code,
          name: data.name,
          isEnabled: false,
          sortOrder: (_max.sortOrder ?? 0) + 1,
        },
      });

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
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        },
      });

      return mapToLocale(locale);
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
      await prisma.$transaction([
        prisma.marketingPageSection.deleteMany({
          where: { locale: code, data: { equals: EMPTY_SECTION_DATA } },
        }),
        prisma.marketingLocale.delete({ where: { code } }),
      ]);
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
