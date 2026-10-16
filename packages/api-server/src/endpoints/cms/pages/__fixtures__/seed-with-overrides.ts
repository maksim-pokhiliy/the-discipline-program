import { type Prisma } from "@prisma/client";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../../test/helpers";

export const seedSectionsWithOverrides = async (
  overrides: Partial<Record<SectionSchemaKey, Prisma.InputJsonValue>>,
  locale: LocaleCode = DEFAULT_LOCALE_CODE,
): Promise<void> => {
  const slugs = Object.values(PageSlug);

  if (locale !== DEFAULT_LOCALE_CODE) {
    await cleanupRaw.marketingLocale.createMany({
      data: [{ code: locale, name: locale, isEnabled: true }],
      skipDuplicates: true,
    });
  }

  await cleanupRaw.marketingPage.createMany({
    data: slugs.map((slug) => ({ slug, title: slug })),
    skipDuplicates: true,
  });

  await cleanupRaw.marketingPageSection.createMany({
    data: slugs.flatMap((slug) =>
      Object.values(PAGE_SECTIONS_MAP[slug]).map((section) => ({
        pageSlug: slug,
        section,
        locale,
        data: overrides[section] ?? {},
        isActive: true,
      })),
    ),
  });
};
