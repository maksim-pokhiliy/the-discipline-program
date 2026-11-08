import { type Prisma } from "@prisma/client";

import { isServedSectionRow } from "../pages/page-sections";

type SectionRowForCount = {
  locale: string;
  pageSlug: string;
  section: string;
  data: Prisma.JsonValue;
};

export const countServedSections = (
  rows: readonly SectionRowForCount[],
): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (isServedSectionRow(row)) {
      counts.set(row.locale, (counts.get(row.locale) ?? 0) + 1);
    }
  }

  return counts;
};

export const countServedSectionsByPage = (
  rows: readonly Omit<SectionRowForCount, "locale">[],
): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (isServedSectionRow(row)) {
      counts.set(row.pageSlug, (counts.get(row.pageSlug) ?? 0) + 1);
    }
  }

  return counts;
};
