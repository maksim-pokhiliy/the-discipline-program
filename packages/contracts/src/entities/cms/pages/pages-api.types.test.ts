import { describe, expectTypeOf, it } from "vitest";
import { type z } from "zod";

import { type LocaleQuery } from "../locale";

import { type UpdatePageSectionBody, type UpdatePageSectionData } from "./pages-api.types";
import { type homePageHeroSchema, type siteNavigationSchema } from "./pages.schema";
import { type SectionSchemaKey } from "./pages.types";

type OmittableLocale = { locale?: string | undefined };

type SectionPayload<TSection extends UpdatePageSectionBody["section"]> = Extract<
  UpdatePageSectionBody,
  { section: TSection }
>["data"];

type DeepPartialInput<TSchema extends z.AnyZodObject> = z.input<ReturnType<TSchema["deepPartial"]>>;

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
