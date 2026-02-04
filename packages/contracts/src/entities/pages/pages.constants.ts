export const PAGE_SLUGS = ["home", "storefront", "about", "blog", "contact"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export const CONTACT_METHOD_TYPES = ["telegram", "email", "phone"] as const;

export const PAGE_SECTIONS_MAP = {
  home: {
    hero: "hero",
    whyChoose: "whyChoose",
    storefront: "storefront",
    reviews: "reviews",
    contact: "contact",
  },
  storefront: {
    hero: "storefront:hero",
    cta: "storefront:cta",
  },
  about: {
    hero: "about:hero",
    journey: "journey",
    credentials: "credentials",
    personal: "personal",
    cta: "cta",
  },
  blog: {
    hero: "blog:hero",
  },
  contact: {
    hero: "contact:hero",
    form: "form",
    directContact: "directContact",
    faq: "faq",
  },
} as const;

export const getPageSectionsOrder = (pageSlug: PageSlug): string[] => {
  const sections = PAGE_SECTIONS_MAP[pageSlug];

  return Object.values(sections);
};
