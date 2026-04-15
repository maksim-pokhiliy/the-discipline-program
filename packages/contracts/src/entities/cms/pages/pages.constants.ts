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
    hero: "home:hero",
    whyChoose: "home:whyChoose",
    storefront: "home:storefront",
    reviews: "home:reviews",
    contact: "home:contact",
  },
  storefront: {
    hero: "storefront:hero",
    grid: "storefront:grid",
    cta: "storefront:cta",
  },
  about: {
    hero: "about:hero",
    journey: "about:journey",
    credentials: "about:credentials",
    personal: "about:personal",
    cta: "about:cta",
  },
  blog: {
    hero: "blog:hero",
    grid: "blog:grid",
    related: "blog:related",
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
