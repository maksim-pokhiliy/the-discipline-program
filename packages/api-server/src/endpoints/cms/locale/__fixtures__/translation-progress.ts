import { PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";

export const UNSERVED_SECTION_RELATIONS = [
  {
    name: "a section outside SECTION_SCHEMAS",
    pageSlug: PageSlug.HOME,
    section: "home:retiredBanner",
  },
  {
    name: "a section under another page's slug",
    pageSlug: PageSlug.HOME,
    section: PAGE_SECTIONS_MAP.about.hero,
  },
  {
    name: "a prototype section key",
    pageSlug: PageSlug.ABOUT,
    section: "constructor",
  },
  {
    name: "a prototype page key",
    pageSlug: "constructor",
    section: PAGE_SECTIONS_MAP.about.hero,
  },
  {
    name: "an unknown page slug",
    pageSlug: "retired",
    section: PAGE_SECTIONS_MAP.about.hero,
  },
];
