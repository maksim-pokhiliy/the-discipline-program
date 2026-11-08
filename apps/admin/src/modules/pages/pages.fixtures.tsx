import { type RenderResult } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import {
  type AdminPageListItem,
  type AdminPageSection,
  type AdminPageDetails,
  type AdminSectionTranslation,
  adminPageSectionSchema,
  PAGE_SECTIONS_MAP,
  SECTION_SCHEMAS,
  SectionTranslationState,
  type PageSlug,
  type SectionSchemaKey,
  type SectionWriteBody,
  type SectionWriteData,
  type seoSectionSchema,
} from "@repo/contracts/cms/pages";

import { render } from "@app/test/render";

import { DEFAULT_EDITOR_LOCALE, type EditorLocale } from "./components/locale-gate";
import { SectionEditor } from "./components/section-editor";

const FIXTURE_DATE = new Date("2026-11-02T09:00:00.000Z");
const FIXTURE_UPDATED_AT = FIXTURE_DATE.toISOString();
const SHARED_FIELD_NAMES = new Set(["id", "iconName", "buttonHref", "backgroundImage", "image"]);

const schemaFixture = (schema: unknown, prefix: string, path: string): unknown => {
  if (schema instanceof z.ZodOptional) {
    return schemaFixture(schema.unwrap(), prefix, path);
  }

  if (schema instanceof z.ZodString) {
    const fieldName = path.split(".").at(-1) ?? "";

    return `${SHARED_FIELD_NAMES.has(fieldName) ? "English" : prefix} ${path}`;
  }

  if (schema instanceof z.ZodArray) {
    return [schemaFixture(schema.element, prefix, `${path}.0`)];
  }

  if (schema instanceof z.ZodObject) {
    return Object.fromEntries(
      Object.entries(schema.shape).map(([name, child]) => [
        name,
        schemaFixture(child, prefix, path ? `${path}.${name}` : name),
      ]),
    );
  }

  throw new Error(`Unsupported section fixture field ${path}`);
};

export const sectionTextEntries = (value: unknown, path = ""): [string, string][] => {
  if (typeof value === "string") {
    return [[path, value]];
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  return Object.entries(value).flatMap(([name, child]) =>
    sectionTextEntries(child, path ? `${path}.${name}` : name),
  );
};

export const SECTION_KEYS: SectionSchemaKey[] = Object.values(PAGE_SECTIONS_MAP).flatMap(
  (sections) => Object.values(sections),
);

export const makeSectionRow = <TKey extends SectionSchemaKey>(
  section: TKey,
  data: SectionWriteData[TKey],
): AdminPageSection =>
  adminPageSectionSchema.parse({
    id: `c${section.replace(":", "")}row`,
    section,
    data,
    updatedAt: FIXTURE_UPDATED_AT,
    hasUnreadableData: false,
    translation: null,
  });

export const makePage = (slug: PageSlug, sections: AdminPageSection[]): AdminPageDetails => ({
  slug,
  locale: "en",
  sections,
});

export const makeTranslatedRow = <TKey extends SectionSchemaKey>(
  section: TKey,
  data: SectionWriteData[TKey],
  translation: AdminSectionTranslation,
): AdminPageSection =>
  adminPageSectionSchema.parse({ ...makeSectionRow(section, data), translation });

export const makePopulatedSectionRow = (
  section: SectionSchemaKey,
  prefix = "English",
): AdminPageSection =>
  adminPageSectionSchema.parse({
    ...makeSectionRow(section, {}),
    data: schemaFixture(SECTION_SCHEMAS[section], prefix, ""),
  });

export const makeLocalizedSectionRow = (
  section: SectionSchemaKey,
  state = SectionTranslationState.TRANSLATED,
): AdminPageSection =>
  adminPageSectionSchema.parse({
    ...makePopulatedSectionRow(section, "Localized"),
    translation: {
      state,
      english: {
        data: makePopulatedSectionRow(section).data,
        updatedAt: FIXTURE_UPDATED_AT,
      },
    },
  });

export const makePageListItem = (slug: PageSlug): AdminPageListItem => ({
  id: `page-${slug}`,
  slug,
  title: `Stored ${slug} title`,
  updatedAt: FIXTURE_DATE,
  translatedSectionCount: null,
});

export const makeSeoData = (): z.infer<typeof seoSectionSchema> => ({
  title: "Fixture title",
  description: "Fixture description",
});

export const renderSectionEditor = (
  row: AdminPageSection,
  onSave: (body: SectionWriteBody) => void = vi.fn(),
  locale: EditorLocale = DEFAULT_EDITOR_LOCALE,
): RenderResult =>
  render(
    <SectionEditor
      section={row}
      locale={locale}
      isExpanded
      onToggle={vi.fn()}
      onSave={onSave}
      isLoading={false}
    />,
  );
