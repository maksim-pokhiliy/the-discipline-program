export enum PageSlug {
  HOME = "home",
  STOREFRONT = "storefront",
  ABOUT = "about",
  BLOG = "blog",
  CONTACT = "contact",
  FAQ = "faq",
}

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
    grid: "storefront:grid",
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
    grid: "blog:grid",
  },
  contact: {
    hero: "contact:hero",
    form: "contact:form",
  },
  faq: {
    hero: "faq:hero",
    content: "faq:content",
    cta: "faq:cta",
  },
} as const;
