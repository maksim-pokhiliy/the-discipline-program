import { type Prisma } from "@prisma/client";

import { type LocaleCode } from "@repo/contracts/cms/locale";
import { type PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../../test/helpers";

export type SectionRowSeed = {
  section: SectionSchemaKey;
  data: Prisma.InputJsonValue;
  isActive: boolean;
};

export const insertSectionRows = async (
  pageSlug: PageSlug,
  locale: LocaleCode,
  rows: readonly SectionRowSeed[],
): Promise<void> => {
  await cleanupRaw.marketingPageSection.createMany({
    data: rows.map((row) => ({ pageSlug, locale, ...row })),
  });
};
