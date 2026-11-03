import { type RenderResult } from "@testing-library/react";
import { vi } from "vitest";
import { type z } from "zod";

import {
  type AdminPageListItem,
  type AdminPageSection,
  type CorrelatedAdminPageDetails,
  PAGE_SECTIONS_MAP,
  type PageSlug,
  type SectionSchemaKey,
  type SectionWriteBody,
  type seoSectionSchema,
} from "@repo/contracts/cms/pages";

import { render } from "@app/test/render";

import { SectionEditor } from "./components/section-editor";

const FIXTURE_DATE = new Date("2026-11-02T09:00:00.000Z");

export const SECTION_KEYS: SectionSchemaKey[] = Object.values(PAGE_SECTIONS_MAP).flatMap(
  (sections) => Object.values(sections),
);

export const makeSectionRow = <TKey extends SectionSchemaKey>(
  section: TKey,
  data: AdminPageSection<TKey>["data"],
): AdminPageSection<TKey> => ({ id: `row-${section}`, section, data, updatedAt: FIXTURE_DATE });

export const makePage = (
  slug: PageSlug,
  sections: AdminPageSection[],
): CorrelatedAdminPageDetails => ({ slug, locale: "en", sections });

export const makePageListItem = (slug: PageSlug): AdminPageListItem => ({
  id: `page-${slug}`,
  slug,
  title: `Stored ${slug} title`,
  updatedAt: FIXTURE_DATE,
});

export const makeSeoData = (): z.infer<typeof seoSectionSchema> => ({
  title: "Fixture title",
  description: "Fixture description",
});

export const renderSectionEditor = <TKey extends SectionSchemaKey>(
  row: AdminPageSection<TKey>,
  onSave: (body: SectionWriteBody<TKey>) => void = vi.fn(),
): RenderResult =>
  render(
    <SectionEditor section={row} isExpanded onToggle={vi.fn()} onSave={onSave} isLoading={false} />,
  );
