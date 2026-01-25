import { z } from "zod";

import { publicBlogPostSchema } from "../blog";
import { featureSchema } from "../feature/feature.schema";
import { reviewSchema } from "../review/review.schema";
import { storefrontProgramSchema } from "../storefront/storefront.schema";

import { PAGE_SLUGS } from "./pages.constants";
import {
  homePageHeroSchema,
  homePageWhyChooseSchema,
  homePageStorefrontProgramsSchema,
  homePageReviewsSchema,
  homePageContactSchema,
  storefrontProgramsPageHeroSchema,
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
} from "./pages.schema";

export const getPageBySlugParamsSchema = z.object({
  pageSlug: z.enum(PAGE_SLUGS),
});

export const getHomePageResponseSchema = z.object({
  hero: homePageHeroSchema,
  whyChoose: homePageWhyChooseSchema,
  storefront: homePageStorefrontProgramsSchema,
  reviews: homePageReviewsSchema,
  contact: homePageContactSchema,
  features: z.array(featureSchema),
  storefrontProgramsList: z.array(storefrontProgramSchema),
  reviewsList: z.array(reviewSchema),
});

export const getStorefrontProgramsPageResponseSchema = z.object({
  hero: storefrontProgramsPageHeroSchema,
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
});

export const pageListItemSchema = z.object({
  slug: z.string(),
  label: z.string(),
});

export const marketingPageSectionSchema = z.object({
  id: z.string(),
  pageSlug: z.string(),
  section: z.string(),
  data: z.unknown(),
  isActive: z.boolean(),
  updatedAt: z.coerce.date(),
});
