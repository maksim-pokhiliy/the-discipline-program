import { describe, expect, it } from "vitest";
import { type z } from "zod";

import { SECTION_SCHEMAS } from "./pages-api.schema";
import { PAGE_SECTIONS_MAP } from "./pages.constants";
import { type DefaultedSectionKey, SECTION_DEFAULTS } from "./section-defaults";

const DEFAULTED_SECTIONS: readonly DefaultedSectionKey[] = [
  PAGE_SECTIONS_MAP.home.seo,
  PAGE_SECTIONS_MAP.storefront.seo,
  PAGE_SECTIONS_MAP.about.seo,
  PAGE_SECTIONS_MAP.blog.seo,
  PAGE_SECTIONS_MAP.contact.seo,
  PAGE_SECTIONS_MAP.faq.seo,
  PAGE_SECTIONS_MAP.offer.seo,
  PAGE_SECTIONS_MAP.site.navigation,
  PAGE_SECTIONS_MAP.site.footer,
  PAGE_SECTIONS_MAP.site.leadForm,
  PAGE_SECTIONS_MAP.site.errors,
];

const UNDEFAULTED_SECTIONS = [
  PAGE_SECTIONS_MAP.offer.hero,
  PAGE_SECTIONS_MAP.offer.requisites,
  PAGE_SECTIONS_MAP.offer.terms,
  PAGE_SECTIONS_MAP.storefront.grid,
];

describe("SECTION_DEFAULTS", () => {
  it("defaults the seo section of every public page and the four site sections, nothing else", () => {
    expect(Object.keys(SECTION_DEFAULTS).sort()).toEqual([...DEFAULTED_SECTIONS].sort());
  });

  it("names the navigation landmark Main", () => {
    expect(SECTION_DEFAULTS[PAGE_SECTIONS_MAP.site.navigation].navigationLabel).toBe("Main");
  });

  it.each(UNDEFAULTED_SECTIONS)("leaves %s without a default", (section) => {
    expect(Object.keys(SECTION_DEFAULTS)).not.toContain(section);
  });

  it.each(DEFAULTED_SECTIONS)("holds the %s default that its schema parses strictly", (section) => {
    const schema: z.AnyZodObject = SECTION_SCHEMAS[section];

    expect(schema.strict().parse(SECTION_DEFAULTS[section])).toEqual(SECTION_DEFAULTS[section]);
  });

  it.each(DEFAULTED_SECTIONS)(
    "fills every field of the %s default with visible text",
    (section) => {
      const blankFields = Object.entries(SECTION_DEFAULTS[section]).filter(
        ([, text]) => text.trim() === "" || text !== text.trim(),
      );

      expect(blankFields).toEqual([]);
    },
  );
});
