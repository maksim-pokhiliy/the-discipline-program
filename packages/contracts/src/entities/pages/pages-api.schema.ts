import { z } from "zod";

import { publicBlogPostSchema } from "../blog";
import { featureSchema } from "../feature/feature.schema";
import { programSchema } from "../program/program.schema";
import { reviewSchema } from "../review/review.schema";

import { PAGE_SLUGS } from "./pages.constants";
import {
  homePageHeroSchema,
  homePageWhyChooseSchema,
  homePageProgramsSchema,
  homePageReviewsSchema,
  homePageContactSchema,
  programsPageHeroSchema,
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
  programs: homePageProgramsSchema,
  reviews: homePageReviewsSchema,
  contact: homePageContactSchema,
  features: z.array(featureSchema),
  programsList: z.array(programSchema),
  reviewsList: z.array(reviewSchema),
});

export const getProgramsPageResponseSchema = z.object({
  hero: programsPageHeroSchema,
  programsList: z.array(programSchema),
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
