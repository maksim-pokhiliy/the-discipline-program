import { describe, expectTypeOf, it } from "vitest";
import { type z } from "zod";

import { type LocaleQuery } from "../locale";

import { type SECTION_SCHEMAS } from "./pages-api.schema";
import {
  type AdminPageSection,
  type AdminSectionTranslation,
  type LocalizedSectionWriteBody,
  type UpdatePageSectionBody,
  type UpdatePageSectionData,
} from "./pages-api.types";
import { type homePageHeroSchema, type siteNavigationSchema } from "./pages.schema";
import { type SectionSchemaKey } from "./pages.types";

type OmittableLocale = { locale?: string | undefined };

type SectionPayload<TSection extends UpdatePageSectionBody["section"]> = Extract<
  UpdatePageSectionBody,
  { section: TSection }
>["data"];

type DeepPartialInput<TSchema extends z.AnyZodObject> = z.input<ReturnType<TSchema["deepPartial"]>>;
type DeepPartialOutput<TSchema extends z.AnyZodObject> = z.output<
  ReturnType<TSchema["deepPartial"]>
>;
type AdminRow<TKey extends SectionSchemaKey> = Extract<AdminPageSection, { section: TKey }>;

describe("request types with a defaulted locale", () => {
  it("let the caller omit the locale", () => {
    expectTypeOf<LocaleQuery>().toEqualTypeOf<OmittableLocale>();
    expectTypeOf<Pick<UpdatePageSectionBody, "locale">>().toEqualTypeOf<OmittableLocale>();
    expectTypeOf<Pick<UpdatePageSectionData, "locale">>().toEqualTypeOf<OmittableLocale>();
  });
});

describe("section write types", () => {
  it("offer a write variant for every section key", () => {
    expectTypeOf<UpdatePageSectionBody["section"]>().toEqualTypeOf<SectionSchemaKey>();
  });

  it("type every payload by the schema of its own section", () => {
    expectTypeOf<{
      [TKey in SectionSchemaKey]: SectionPayload<TKey>;
    }>().toEqualTypeOf<{
      [TKey in SectionSchemaKey]: DeepPartialInput<(typeof SECTION_SCHEMAS)[TKey]>;
    }>();
    expectTypeOf<SectionPayload<"home:hero">>().toEqualTypeOf<
      DeepPartialInput<typeof homePageHeroSchema>
    >();
    expectTypeOf<SectionPayload<"site:navigation">>().toEqualTypeOf<
      DeepPartialInput<typeof siteNavigationSchema>
    >();
  });

  it("keep a field of one section out of another section's payload", () => {
    expectTypeOf<SectionPayload<"blog:related">>().not.toHaveProperty("buttonText");
    expectTypeOf<SectionPayload<"home:hero">>().toHaveProperty("buttonText");
  });
});

describe("admin read types", () => {
  it("correlates every admin row's data with its own section", () => {
    expectTypeOf<AdminPageSection["section"]>().toEqualTypeOf<SectionSchemaKey>();
    expectTypeOf<{
      [TKey in SectionSchemaKey]: AdminRow<TKey>["data"];
    }>().toEqualTypeOf<{
      [TKey in SectionSchemaKey]: DeepPartialOutput<(typeof SECTION_SCHEMAS)[TKey]>;
    }>();
    expectTypeOf<{
      [TKey in SectionSchemaKey]: NonNullable<AdminRow<TKey>["translation"]>["english"]["data"];
    }>().toEqualTypeOf<{
      [TKey in SectionSchemaKey]: DeepPartialOutput<(typeof SECTION_SCHEMAS)[TKey]>;
    }>();
  });

  it("types the admin read dates as strings", () => {
    expectTypeOf<AdminPageSection["updatedAt"]>().toEqualTypeOf<string>();
    expectTypeOf<AdminSectionTranslation["english"]["updatedAt"]>().toEqualTypeOf<string>();
  });

  it("requires the locale on a localized write body", () => {
    expectTypeOf<{
      section: "home:hero";
      data: { title: string };
    }>().not.toExtend<LocalizedSectionWriteBody>();
    expectTypeOf<{
      section: "home:hero";
      data: { title: string };
      locale: "uk";
    }>().toExtend<LocalizedSectionWriteBody>();
    expectTypeOf<LocalizedSectionWriteBody["locale"]>().toEqualTypeOf<string>();
  });
});
