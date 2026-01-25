import { type z } from "zod";

import * as schemas from "./pages.schema";

export const PAGES_REGISTRY = {
  home: {
    hero: schemas.homePageHeroSchema,
    whyChoose: schemas.homePageWhyChooseSchema,
    storefront: schemas.homePageStorefrontProgramsSchema,
    reviews: schemas.homePageReviewsSchema,
    contact: schemas.homePageContactSchema,
  },
  storefront: {
    hero: schemas.storefrontProgramsPageHeroSchema,
  },
  about: {
    hero: schemas.aboutPageHeroSchema,
    journey: schemas.aboutPageJourneySchema,
    credentials: schemas.aboutPageCredentialsSchema,
    personal: schemas.aboutPagePersonalSchema,
    cta: schemas.aboutPageCtaSchema,
  },
  contact: {
    hero: schemas.contactPageHeroSchema,
    form: schemas.contactFormSchema,
    directContact: schemas.contactDirectContactSchema,
    faq: schemas.contactPageFaqSchema,
  },
  blog: {
    hero: schemas.blogPageHeroSchema,
  },
} as const;

export type PagesRegistry = typeof PAGES_REGISTRY;

export type PageSlug = keyof PagesRegistry;

export type SectionKey<P extends PageSlug> = keyof PagesRegistry[P];

export type RegistryData = {
  [P in PageSlug]: {
    [S in SectionKey<P>]: PagesRegistry[P][S] extends z.ZodTypeAny
      ? z.infer<PagesRegistry[P][S]>
      : never;
  };
};

export type SectionData<P extends PageSlug, S extends SectionKey<P>> = RegistryData[P][S];
