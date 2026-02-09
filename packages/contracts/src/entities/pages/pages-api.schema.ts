import { z } from "zod";

import { publicBlogPostSchema } from "../blog";
import { reviewSchema } from "../review/review.schema";
import { storefrontProgramSchema } from "../storefront/storefront.schema";

import { PAGE_SLUGS, PAGE_SECTIONS_MAP } from "./pages.constants";
import {
  homePageHeroSchema,
  homePageWhyChooseSchema,
  homePageStorefrontProgramsSchema,
  homePageReviewsSchema,
  homePageContactSchema,
  storefrontProgramsPageHeroSchema,
  storefrontPageCtaSchema,
  aboutPageHeroSchema,
  aboutPageJourneySchema,
  aboutPageCredentialsSchema,
  aboutPagePersonalSchema,
  aboutPageCtaSchema,
  contactPageHeroSchema,
  contactFormSchema,
  contactDirectContactSchema,
  contactPageFaqSchema,
  blogPageHeroSchema,
  programOptionSchema,
} from "./pages.schema";

export const getHomePageResponseSchema = z.object({
  hero: homePageHeroSchema,
  whyChoose: homePageWhyChooseSchema,
  storefront: homePageStorefrontProgramsSchema,
  reviews: homePageReviewsSchema,
  contact: homePageContactSchema,
  storefrontProgramsList: z.array(storefrontProgramSchema),
  reviewsList: z.array(reviewSchema),
});

export const getStorefrontProgramsPageResponseSchema = z.object({
  hero: storefrontProgramsPageHeroSchema,
  cta: storefrontPageCtaSchema,
  programsList: z.array(storefrontProgramSchema),
});

export const getAboutPageResponseSchema = z.object({
  hero: aboutPageHeroSchema,
  journey: aboutPageJourneySchema,
  credentials: aboutPageCredentialsSchema,
  personal: aboutPagePersonalSchema,
  cta: aboutPageCtaSchema,
});

export const getBlogPageResponseSchema = z.object({
  hero: blogPageHeroSchema,
  featuredPost: publicBlogPostSchema.optional(),
  posts: z.array(publicBlogPostSchema),
  categories: z.array(z.string()),
});

export const getContactPageResponseSchema = z.object({
  hero: contactPageHeroSchema,
  form: contactFormSchema,
  directContact: contactDirectContactSchema,
  faq: contactPageFaqSchema,
  programOptions: z.array(programOptionSchema),
});

export const adminPageListItemSchema = z.object({
  id: z.string(),
  slug: z.enum(PAGE_SLUGS),
  title: z.string(),
  updatedAt: z.date(),
});

export const updatePageMetadataSchema = z.object({
  title: z.string().min(1, "Name is required"),
  seoTitle: z.string().optional().nullable(),
  seoDesc: z.string().optional().nullable(),
});

export const updatePageSectionSchema = z
  .discriminatedUnion("section", [
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.home.hero), data: homePageHeroSchema }),
    z.object({
      section: z.literal(PAGE_SECTIONS_MAP.home.whyChoose),
      data: homePageWhyChooseSchema,
    }),
    z.object({
      section: z.literal(PAGE_SECTIONS_MAP.home.storefront),
      data: homePageStorefrontProgramsSchema,
    }),
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.home.reviews), data: homePageReviewsSchema }),
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.home.contact), data: homePageContactSchema }),
    z.object({
      section: z.literal(PAGE_SECTIONS_MAP.storefront.hero),
      data: storefrontProgramsPageHeroSchema,
    }),
    z.object({
      section: z.literal(PAGE_SECTIONS_MAP.storefront.cta),
      data: storefrontPageCtaSchema,
    }),
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.about.hero), data: aboutPageHeroSchema }),
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.about.journey), data: aboutPageJourneySchema }),
    z.object({
      section: z.literal(PAGE_SECTIONS_MAP.about.credentials),
      data: aboutPageCredentialsSchema,
    }),
    z.object({
      section: z.literal(PAGE_SECTIONS_MAP.about.personal),
      data: aboutPagePersonalSchema,
    }),
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.about.cta), data: aboutPageCtaSchema }),
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.blog.hero), data: blogPageHeroSchema }),
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.contact.hero), data: contactPageHeroSchema }),
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.contact.form), data: contactFormSchema }),
    z.object({
      section: z.literal(PAGE_SECTIONS_MAP.contact.directContact),
      data: contactDirectContactSchema,
    }),
    z.object({ section: z.literal(PAGE_SECTIONS_MAP.contact.faq), data: contactPageFaqSchema }),
  ])
  .and(z.object({ pageSlug: z.enum(PAGE_SLUGS) }));

export const adminPageDetailsSchema = z.object({
  slug: z.enum(PAGE_SLUGS),
  sections: z.array(
    z.object({
      id: z.string(),
      section: z.string(),
      data: z.record(z.unknown()),
      updatedAt: z.date(),
    }),
  ),
});

export const getPageBySlugParamsSchema = z.object({
  pageSlug: z.enum(PAGE_SLUGS),
});

export const SECTION_SCHEMAS = {
  [PAGE_SECTIONS_MAP.home.hero]: homePageHeroSchema,
  [PAGE_SECTIONS_MAP.home.whyChoose]: homePageWhyChooseSchema,
  [PAGE_SECTIONS_MAP.home.storefront]: homePageStorefrontProgramsSchema,
  [PAGE_SECTIONS_MAP.home.reviews]: homePageReviewsSchema,
  [PAGE_SECTIONS_MAP.home.contact]: homePageContactSchema,
  [PAGE_SECTIONS_MAP.storefront.hero]: storefrontProgramsPageHeroSchema,
  [PAGE_SECTIONS_MAP.storefront.cta]: storefrontPageCtaSchema,
  [PAGE_SECTIONS_MAP.about.hero]: aboutPageHeroSchema,
  [PAGE_SECTIONS_MAP.about.journey]: aboutPageJourneySchema,
  [PAGE_SECTIONS_MAP.about.credentials]: aboutPageCredentialsSchema,
  [PAGE_SECTIONS_MAP.about.personal]: aboutPagePersonalSchema,
  [PAGE_SECTIONS_MAP.about.cta]: aboutPageCtaSchema,
  [PAGE_SECTIONS_MAP.blog.hero]: blogPageHeroSchema,
  [PAGE_SECTIONS_MAP.contact.hero]: contactPageHeroSchema,
  [PAGE_SECTIONS_MAP.contact.form]: contactFormSchema,
  [PAGE_SECTIONS_MAP.contact.directContact]: contactDirectContactSchema,
  [PAGE_SECTIONS_MAP.contact.faq]: contactPageFaqSchema,
} as const;
