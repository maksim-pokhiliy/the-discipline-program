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
    z.object({ section: z.literal("hero"), data: homePageHeroSchema }),
    z.object({ section: z.literal("whyChoose"), data: homePageWhyChooseSchema }),
    z.object({ section: z.literal("storefront"), data: homePageStorefrontProgramsSchema }),
    z.object({ section: z.literal("reviews"), data: homePageReviewsSchema }),
    z.object({ section: z.literal("contact"), data: homePageContactSchema }),
    z.object({ section: z.literal("about:hero"), data: aboutPageHeroSchema }),
    z.object({ section: z.literal("journey"), data: aboutPageJourneySchema }),
    z.object({ section: z.literal("credentials"), data: aboutPageCredentialsSchema }),
    z.object({ section: z.literal("personal"), data: aboutPagePersonalSchema }),
    z.object({ section: z.literal("cta"), data: aboutPageCtaSchema }),
    z.object({ section: z.literal("contact:hero"), data: contactPageHeroSchema }),
    z.object({ section: z.literal("form"), data: contactFormSchema }),
    z.object({ section: z.literal("directContact"), data: contactDirectContactSchema }),
    z.object({ section: z.literal("faq"), data: contactPageFaqSchema }),
    z.object({ section: z.literal("blog:hero"), data: blogPageHeroSchema }),
    z.object({ section: z.literal("storefront:hero"), data: storefrontProgramsPageHeroSchema }),
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
