import { type Prisma } from "@prisma/client";

import { type LocaleCode } from "@repo/contracts/cms/locale";
import { type PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { insertSectionRows, type SectionRowSeed } from "./localized-section-rows";
import { updateEnglishSection } from "./update-english-section";

export const sectionFallbackCases = (
  section: SectionSchemaKey,
  localizedData: Prisma.InputJsonValue,
  invalidData: Prisma.InputJsonValue,
): readonly (readonly [string, readonly SectionRowSeed[]])[] => [
  ["missing", []],
  ["present and empty", [{ section, data: {}, isActive: true }]],
  ["present and inactive", [{ section, data: localizedData, isActive: false }]],
  ["present and unparsable", [{ section, data: invalidData, isActive: true }]],
];

export const seedUnqualifiedSectionRows = async (
  pageSlug: PageSlug,
  locale: LocaleCode,
  row: Omit<SectionRowSeed, "isActive">,
  invalidEnglishData: Prisma.InputJsonValue,
): Promise<void> => {
  await updateEnglishSection(pageSlug, row.section, { data: invalidEnglishData });
  await insertSectionRows(pageSlug, locale, [{ ...row, isActive: false }]);
};
