import { z } from "zod";

const SECTION_ROW_LOCALES = z.array(z.object({ locale: z.string() }));

export const fetchedLocales = async (results: readonly { value: unknown }[]): Promise<string[]> => {
  const rows = await Promise.all(results.map((result) => result.value));
  const locales = SECTION_ROW_LOCALES.parse(rows.flat()).map((row) => row.locale);

  return [...new Set(locales)].sort();
};
