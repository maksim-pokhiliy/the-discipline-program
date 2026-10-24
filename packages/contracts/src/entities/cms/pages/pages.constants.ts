export enum PageSlug {
  HOME = "home",
  STOREFRONT = "storefront",
  ABOUT = "about",
  BLOG = "blog",
  CONTACT = "contact",
  FAQ = "faq",
  OFFER = "offer",
  SITE = "site",
}

export type PublicPageSlug = Exclude<PageSlug, PageSlug.SITE>;

export const isPublicPageSlug = (slug: PageSlug): slug is PublicPageSlug => slug !== PageSlug.SITE;

export const PAGE_SLUG_PATH_MAP: Record<PublicPageSlug, string> = {
  [PageSlug.HOME]: "/",
  [PageSlug.STOREFRONT]: "/storefront",
  [PageSlug.ABOUT]: "/about",
  [PageSlug.BLOG]: "/blog",
  [PageSlug.CONTACT]: "/contact",
  [PageSlug.FAQ]: "/faq",
  [PageSlug.OFFER]: "/offer",
};

export const PAGE_SECTIONS_MAP = {
  home: {
    hero: "home:hero",
    whyChoose: "home:whyChoose",
    storefront: "home:storefront",
    reviews: "home:reviews",
    contact: "home:contact",
    seo: "home:seo",
  },
  storefront: {
    hero: "storefront:hero",
    grid: "storefront:grid",
    cta: "storefront:cta",
    seo: "storefront:seo",
  },
  about: {
    hero: "about:hero",
    journey: "about:journey",
    credentials: "about:credentials",
    personal: "about:personal",
    cta: "about:cta",
    seo: "about:seo",
  },
  blog: {
    hero: "blog:hero",
    grid: "blog:grid",
    related: "blog:related",
    seo: "blog:seo",
  },
  contact: {
    hero: "contact:hero",
    form: "contact:form",
    seo: "contact:seo",
  },
  faq: {
    hero: "faq:hero",
    content: "faq:content",
    cta: "faq:cta",
    seo: "faq:seo",
  },
  offer: {
    hero: "offer:hero",
    requisites: "offer:requisites",
    terms: "offer:terms",
    seo: "offer:seo",
  },
  site: {
    navigation: "site:navigation",
    footer: "site:footer",
    leadForm: "site:leadForm",
    errors: "site:errors",
  },
} as const;
