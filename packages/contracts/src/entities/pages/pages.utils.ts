import { PAGE_SECTIONS_MAP, type PageSlug } from "./pages.constants";

export const getPageSectionsOrder = (pageSlug: PageSlug): string[] => {
  const sections = PAGE_SECTIONS_MAP[pageSlug];

  return Object.values(sections);
};

export const SECTION_FEATURES = {
  hero: { hasButton: true, hasBackground: true },
  "about:hero": { hasButton: true, hasBackground: true },
  "contact:hero": { hasButton: false, hasBackground: true },
  "blog:hero": { hasButton: false, hasBackground: true },
  "storefront:hero": { hasButton: false, hasBackground: false },
} as const;

export type HeroSectionType = keyof typeof SECTION_FEATURES;
