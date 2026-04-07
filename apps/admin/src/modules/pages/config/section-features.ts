export const SECTION_FEATURES = {
  hero: { hasButton: true, hasBackground: true },
  "about:hero": { hasButton: true, hasBackground: true },
  "contact:hero": { hasButton: true, hasBackground: true },
  "blog:hero": { hasButton: false, hasBackground: true },
  "faq:hero": { hasButton: true, hasBackground: true },
  "storefront:hero": { hasButton: true, hasBackground: true },
} as const;

export type HeroSectionType = keyof typeof SECTION_FEATURES;
