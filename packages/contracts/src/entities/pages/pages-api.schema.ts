import { z } from "zod";

import { publicBlogPostSchema } from "../blog";
import { productSchema } from "../product";
import { reviewSchema } from "../review";

import { PageSlug, PAGE_SECTIONS_MAP } from "./pages.constants";
import {
  homePageHeroSchema,
  homePageWhyChooseSchema,
  homePageStorefrontProgramsSchema,
  homePageReviewsSchema,
  homePageContactSchema,
  storefrontProgramsPageHeroSchema,
  storefrontGridSchema,
  storefrontPageCtaSchema,
  aboutPageHeroSchema,
  aboutPageJourneySchema,
  aboutPageCredentialsSchema,
  aboutPagePersonalSchema,
  aboutPageCtaSchema,
  contactPageHeroSchema,
  contactPageFormSchema,
  faqContentSchema,
  faqPageHeroSchema,
  faqPageCtaSchema,
  blogPageHeroSchema,
  blogGridSchema,
  blogRelatedSectionSchema,
  programOptionSchema,
} from "./pages.schema";

export const getHomePageResponseSchema = z.object({
  hero: homePageHeroSchema,
  whyChoose: homePageWhyChooseSchema,
  storefront: homePageStorefrontProgramsSchema,
  reviews: homePageReviewsSchema,
  contact: homePageContactSchema,
  productsList: z.array(productSchema),
  reviewsList: z.array(reviewSchema),
});

export const getStorefrontProgramsPageResponseSchema = z.object({
  hero: storefrontProgramsPageHeroSchema,
  grid: storefrontGridSchema,
  cta: storefrontPageCtaSchema,
  productsList: z.array(productSchema),
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
  grid: blogGridSchema,
  featuredPost: publicBlogPostSchema.optional(),
  posts: z.array(publicBlogPostSchema),
  categories: z.array(z.string()),
});

export const getContactPageResponseSchema = z.object({
  hero: contactPageHeroSchema,
  form: contactPageFormSchema,
  programOptions: z.array(programOptionSchema),
});

export const getFaqPageResponseSchema = z.object({
  hero: faqPageHeroSchema,
  content: faqContentSchema,
  cta: faqPageCtaSchema,
});

export const adminPageListItemSchema = z.object({
  id: z.string().cuid(),
  slug: z.nativeEnum(PageSlug),
  title: z.string(),
  updatedAt: z.date(),
});

export const updatePageMetadataSchema = z.object({
  title: z.string().min(1, "Name is required"),
  seoTitle: z.string().optional().nullable(),
  seoDesc: z.string().optional().nullable(),
});

const SECTION_DEFINITIONS = [
  [PAGE_SECTIONS_MAP.home.hero, homePageHeroSchema],
  [PAGE_SECTIONS_MAP.home.whyChoose, homePageWhyChooseSchema],
  [PAGE_SECTIONS_MAP.home.storefront, homePageStorefrontProgramsSchema],
  [PAGE_SECTIONS_MAP.home.reviews, homePageReviewsSchema],
  [PAGE_SECTIONS_MAP.home.contact, homePageContactSchema],
  [PAGE_SECTIONS_MAP.storefront.hero, storefrontProgramsPageHeroSchema],
  [PAGE_SECTIONS_MAP.storefront.grid, storefrontGridSchema],
  [PAGE_SECTIONS_MAP.storefront.cta, storefrontPageCtaSchema],
  [PAGE_SECTIONS_MAP.about.hero, aboutPageHeroSchema],
  [PAGE_SECTIONS_MAP.about.journey, aboutPageJourneySchema],
  [PAGE_SECTIONS_MAP.about.credentials, aboutPageCredentialsSchema],
  [PAGE_SECTIONS_MAP.about.personal, aboutPagePersonalSchema],
  [PAGE_SECTIONS_MAP.about.cta, aboutPageCtaSchema],
  [PAGE_SECTIONS_MAP.blog.hero, blogPageHeroSchema],
  [PAGE_SECTIONS_MAP.blog.grid, blogGridSchema],
  [PAGE_SECTIONS_MAP.blog.related, blogRelatedSectionSchema],
  [PAGE_SECTIONS_MAP.contact.hero, contactPageHeroSchema],
  [PAGE_SECTIONS_MAP.contact.form, contactPageFormSchema],
  [PAGE_SECTIONS_MAP.faq.hero, faqPageHeroSchema],
  [PAGE_SECTIONS_MAP.faq.content, faqContentSchema],
  [PAGE_SECTIONS_MAP.faq.cta, faqPageCtaSchema],
] as const;

const sectionVariants = SECTION_DEFINITIONS.map(([key, schema]) =>
  z.object({ section: z.literal(key), data: schema }),
);

const toNonEmptyArray = <T>(arr: T[]): [T, ...T[]] => {
  const [first, ...rest] = arr;

  if (first === undefined) {
    throw new Error("Expected non-empty array");
  }

  return [first, ...rest];
};

export const updatePageSectionBodySchema = z.discriminatedUnion(
  "section",
  toNonEmptyArray(sectionVariants),
);

export const updatePageSectionSchema = updatePageSectionBodySchema.and(
  z.object({ pageSlug: z.nativeEnum(PageSlug) }),
);

const adminSectionVariants = SECTION_DEFINITIONS.map(([key, schema]) =>
  z.object({
    id: z.string().cuid(),
    section: z.literal(key),
    data: schema,
    updatedAt: z.date(),
  }),
);

export const adminPageDetailsSchema = z.object({
  slug: z.nativeEnum(PageSlug),
  sections: z.array(z.discriminatedUnion("section", toNonEmptyArray(adminSectionVariants))),
});

export const getPageBySlugParamsSchema = z.object({
  pageSlug: z.nativeEnum(PageSlug),
});

export const pageSlugRouteParamsSchema = z.object({
  slug: z.nativeEnum(PageSlug),
});

type SectionEntry = (typeof SECTION_DEFINITIONS)[number];
type SectionKey = SectionEntry[0];
type SectionSchemaMap = { [K in SectionKey]: Extract<SectionEntry, readonly [K, unknown]>[1] };

export const SECTION_SCHEMAS: SectionSchemaMap = {
  [PAGE_SECTIONS_MAP.home.hero]: homePageHeroSchema,
  [PAGE_SECTIONS_MAP.home.whyChoose]: homePageWhyChooseSchema,
  [PAGE_SECTIONS_MAP.home.storefront]: homePageStorefrontProgramsSchema,
  [PAGE_SECTIONS_MAP.home.reviews]: homePageReviewsSchema,
  [PAGE_SECTIONS_MAP.home.contact]: homePageContactSchema,
  [PAGE_SECTIONS_MAP.storefront.hero]: storefrontProgramsPageHeroSchema,
  [PAGE_SECTIONS_MAP.storefront.grid]: storefrontGridSchema,
  [PAGE_SECTIONS_MAP.storefront.cta]: storefrontPageCtaSchema,
  [PAGE_SECTIONS_MAP.about.hero]: aboutPageHeroSchema,
  [PAGE_SECTIONS_MAP.about.journey]: aboutPageJourneySchema,
  [PAGE_SECTIONS_MAP.about.credentials]: aboutPageCredentialsSchema,
  [PAGE_SECTIONS_MAP.about.personal]: aboutPagePersonalSchema,
  [PAGE_SECTIONS_MAP.about.cta]: aboutPageCtaSchema,
  [PAGE_SECTIONS_MAP.blog.hero]: blogPageHeroSchema,
  [PAGE_SECTIONS_MAP.blog.grid]: blogGridSchema,
  [PAGE_SECTIONS_MAP.blog.related]: blogRelatedSectionSchema,
  [PAGE_SECTIONS_MAP.contact.hero]: contactPageHeroSchema,
  [PAGE_SECTIONS_MAP.contact.form]: contactPageFormSchema,
  [PAGE_SECTIONS_MAP.faq.hero]: faqPageHeroSchema,
  [PAGE_SECTIONS_MAP.faq.content]: faqContentSchema,
  [PAGE_SECTIONS_MAP.faq.cta]: faqPageCtaSchema,
};
