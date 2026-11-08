import { type RenderResult } from "@testing-library/react";
import { vi } from "vitest";
import { type z } from "zod";

import {
  type AdminPageListItem,
  type AdminPageSection,
  type AdminPageDetails,
  adminPageSectionSchema,
  PAGE_SECTIONS_MAP,
  type PageSlug,
  type SectionSchemaKey,
  type SectionWriteBody,
  type SectionWriteData,
  type seoSectionSchema,
} from "@repo/contracts/cms/pages";

import { render } from "@app/test/render";

import { SectionEditor } from "./components/section-editor";

const FIXTURE_DATE = new Date("2026-11-02T09:00:00.000Z");
const FIXTURE_UPDATED_AT = FIXTURE_DATE.toISOString();

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
): RenderResult =>
  render(
    <SectionEditor section={row} isExpanded onToggle={vi.fn()} onSave={onSave} isLoading={false} />,
  );
