import { type Prisma } from "@prisma/client";

import { isSectionOfPage, parseServedSectionData } from "../pages/page-sections";

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
    if (
      isSectionOfPage(row.pageSlug, row.section) &&
      parseServedSectionData(row.section, row.data).kind === "served"
    ) {
      counts.set(row.locale, (counts.get(row.locale) ?? 0) + 1);
    }
  }

  return counts;
};
