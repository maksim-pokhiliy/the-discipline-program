import { type Prisma } from "@prisma/client";
import { type z } from "zod";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import {
  PAGE_SECTIONS_MAP,
  type PageSlug,
  SECTION_DEFAULTS,
  SECTION_SCHEMAS,
  SectionTranslationState,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";

import { asJsonRecord } from "../../../utils";

export type SectionData<TKey extends SectionSchemaKey> = z.infer<
  ReturnType<(typeof SECTION_SCHEMAS)[TKey]["deepPartial"]>
>;

export type ServedSectionParse<TKey extends SectionSchemaKey> =
  | { kind: "served"; data: SectionData<TKey> }
  | { kind: "empty" }
  | { kind: "invalid"; error: z.ZodError };

type SectionRowForState = {
  pageSlug: string;
  section: string;
  data: Prisma.JsonValue;
  isActive: boolean;
  updatedAt: Date;
};

export type ReadableSectionData = { data: Prisma.InputJsonObject; isReadable: boolean };

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

export const isServedSectionRow = (
  row: Pick<SectionRowForState, "pageSlug" | "section" | "data">,
): boolean =>
  isSectionOfPage(row.pageSlug, row.section) &&
  parseServedSectionData(row.section, row.data).kind === "served";

export const sectionTranslationState = (
  row: SectionRowForState,
  englishUpdatedAt: Date,
): SectionTranslationState => {
  if (!isServedSectionRow(row)) {
    return SectionTranslationState.NOT_TRANSLATED;
  }

  if (!row.isActive) {
    return SectionTranslationState.DRAFT;
  }

  return englishUpdatedAt.getTime() > row.updatedAt.getTime()
    ? SectionTranslationState.ENGLISH_NEWER
    : SectionTranslationState.TRANSLATED;
};

export const readableSectionData = (
  section: SectionSchemaKey,
  data: Prisma.JsonValue | null,
): ReadableSectionData => {
  const result = SECTION_SCHEMAS[section].deepPartial().safeParse(asJsonRecord(data) ?? {});

  return result.success
    ? { data: result.data, isReadable: true }
    : { data: EMPTY_SECTION_DATA, isReadable: false };
};

export const lockPageSection = async (
  tx: Pick<Prisma.TransactionClient, "$executeRaw">,
  pageSlug: PageSlug,
  section: SectionSchemaKey,
): Promise<void> => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`cms-page-section:${pageSlug}:${section}`}))`;
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
