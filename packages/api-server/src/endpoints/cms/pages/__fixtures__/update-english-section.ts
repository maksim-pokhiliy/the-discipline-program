import { type Prisma } from "@prisma/client";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { type PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../../test/helpers";

export const updateEnglishSection = async (
  pageSlug: PageSlug,
  section: SectionSchemaKey,
  data: Prisma.MarketingPageSectionUpdateInput,
): Promise<void> => {
  await cleanupRaw.marketingPageSection.update({
    where: { pageSlug_section_locale: { pageSlug, section, locale: DEFAULT_LOCALE_CODE } },
    data,
  });
};
