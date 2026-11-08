import { type Prisma } from "@prisma/client";

import { isServedSectionRow } from "../pages/page-sections";

type SectionRowForCount = {
  locale: string;
  pageSlug: string;
  section: string;
  data: Prisma.JsonValue;
};

const countServedSectionsBy = <TRow extends Omit<SectionRowForCount, "locale">>(
  rows: readonly TRow[],
  keyOf: (row: TRow) => string,
): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (isServedSectionRow(row)) {
      const key = keyOf(row);

      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return counts;
};

export const countServedSections = (
  rows: readonly SectionRowForCount[],
): ReadonlyMap<string, number> => countServedSectionsBy(rows, (row) => row.locale);

export const countServedSectionsByPage = (
  rows: readonly Omit<SectionRowForCount, "locale">[],
): ReadonlyMap<string, number> => countServedSectionsBy(rows, (row) => row.pageSlug);
