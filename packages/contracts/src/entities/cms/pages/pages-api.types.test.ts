import { describe, expectTypeOf, it } from "vitest";

import { type LocaleQuery } from "../locale";

import { type UpdatePageSectionBody, type UpdatePageSectionData } from "./pages-api.types";

type OmittableLocale = { locale?: string | undefined };

describe("request types with a defaulted locale", () => {
  it("let the caller omit the locale", () => {
    expectTypeOf<LocaleQuery>().toEqualTypeOf<OmittableLocale>();
    expectTypeOf<Pick<UpdatePageSectionBody, "locale">>().toEqualTypeOf<OmittableLocale>();
    expectTypeOf<Pick<UpdatePageSectionData, "locale">>().toEqualTypeOf<OmittableLocale>();
  });
});
