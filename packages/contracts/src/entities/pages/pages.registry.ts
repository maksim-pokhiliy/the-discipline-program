import { type z } from "zod";

import {
  aboutPageCredentialsSchema,
  aboutPageCtaSchema,
  aboutPageHeroSchema,
  aboutPageJourneySchema,
  aboutPagePersonalSchema,
  blogPageHeroSchema,
  contactDirectContactSchema,
  contactFormSchema,
  contactPageFaqSchema,
  contactPageHeroSchema,
  homePageContactSchema,
  homePageHeroSchema,
  homePageReviewsSchema,
  homePageStorefrontProgramsSchema,
  homePageWhyChooseSchema,
  storefrontProgramsPageHeroSchema,
} from "./pages.schema";

export const PAGES_SECTIONS_REGISTRY: Record<string, Record<string, z.ZodType>> = {
  home: {
    hero: homePageHeroSchema,
    whyChoose: homePageWhyChooseSchema,
    storefront: homePageStorefrontProgramsSchema,
    reviews: homePageReviewsSchema,
    contact: homePageContactSchema,
  },
  storefront: {
    hero: storefrontProgramsPageHeroSchema,
  },
  about: {
    hero: aboutPageHeroSchema,
    journey: aboutPageJourneySchema,
    credentials: aboutPageCredentialsSchema,
    personal: aboutPagePersonalSchema,
    cta: aboutPageCtaSchema,
  },
  blog: {
    hero: blogPageHeroSchema,
  },
  contact: {
    hero: contactPageHeroSchema,
    form: contactFormSchema,
    directContact: contactDirectContactSchema,
    faq: contactPageFaqSchema,
  },
};

export type PageSectionKey<T extends keyof typeof PAGES_SECTIONS_REGISTRY> =
  keyof (typeof PAGES_SECTIONS_REGISTRY)[T];
