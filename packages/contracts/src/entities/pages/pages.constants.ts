export enum PageSlug {
  HOME = "home",
  STOREFRONT = "storefront",
  ABOUT = "about",
  BLOG = "blog",
  CONTACT = "contact",
}

export enum ContactMethodType {
  TELEGRAM = "telegram",
  EMAIL = "email",
  PHONE = "phone",
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
