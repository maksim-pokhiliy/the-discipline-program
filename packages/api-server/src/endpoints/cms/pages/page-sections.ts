import { type Prisma } from "@prisma/client";
import { type z } from "zod";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import {
  PAGE_SECTIONS_MAP,
  type PageSlug,
  SECTION_DEFAULTS,
  SECTION_SCHEMAS,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";

export type SectionData<TKey extends SectionSchemaKey> = z.infer<
  ReturnType<(typeof SECTION_SCHEMAS)[TKey]["deepPartial"]>
>;

export type ServedSectionParse<TKey extends SectionSchemaKey> =
  | { kind: "served"; data: SectionData<TKey> }
  | { kind: "empty" }
  | { kind: "invalid"; error: z.ZodError };

export const EMPTY_SECTION_DATA: Prisma.InputJsonObject = {};

const DEFAULT_SECTION_DATA: ReadonlyMap<string, Prisma.InputJsonObject> = new Map(
  Object.entries(SECTION_DEFAULTS),
);

const PAGE_SECTION_KEYS: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  Object.entries(PAGE_SECTIONS_MAP).map(([pageSlug, sections]) => [
    pageSlug,
    new Set(Object.values(sections)),
  ]),
);

export const isSectionOfPage = (pageSlug: string, section: string): section is SectionSchemaKey =>
  PAGE_SECTION_KEYS.get(pageSlug)?.has(section) ?? false;

export const parseServedSectionData = <TKey extends SectionSchemaKey>(
  section: TKey,
  data: unknown,
): ServedSectionParse<TKey> => {
  const result = SECTION_SCHEMAS[section].deepPartial().safeParse(data);

  if (!result.success) {
    return { kind: "invalid", error: result.error };
  }

  const parsed = result.data as SectionData<TKey>;

  if (Object.keys(parsed).length === 0) {
    return { kind: "empty" };
  }

  return { kind: "served", data: parsed };
};

export const getPageSectionsOrder = (pageSlug: PageSlug): string[] => {
  const sections = PAGE_SECTIONS_MAP[pageSlug];

  return Object.values(sections);
};

export const scaffoldSectionData = (
  section: string,
  locale: LocaleCode,
): Prisma.InputJsonObject => {
  if (locale !== DEFAULT_LOCALE_CODE) {
    return EMPTY_SECTION_DATA;
  }

  return DEFAULT_SECTION_DATA.get(section) ?? EMPTY_SECTION_DATA;
};
