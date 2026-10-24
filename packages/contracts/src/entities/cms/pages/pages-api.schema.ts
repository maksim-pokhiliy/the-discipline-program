import { z } from "zod";

import { publicBlogPostSchema } from "../blog";
import { DEFAULT_LOCALE_CODE, localeCodeSchema } from "../locale";
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
  seoSectionSchema,
  offerPageHeroSchema,
  offerRequisitesSchema,
  offerTermsSchema,
  siteNavigationSchema,
  siteFooterSchema,
  siteLeadFormSchema,
  siteErrorsSchema,
} from "./pages.schema";

const seoResponseSchema = seoSectionSchema.deepPartial().nullable();

export const getHomePageResponseSchema = z.object({
  hero: homePageHeroSchema.deepPartial().nullable(),
  whyChoose: homePageWhyChooseSchema.deepPartial().nullable(),
  storefront: homePageStorefrontProgramsSchema.deepPartial().nullable(),
  reviews: homePageReviewsSchema.deepPartial().nullable(),
  contact: homePageContactSchema.deepPartial().nullable(),
  seo: seoResponseSchema,
  productsList: z.array(productSchema),
  reviewsList: z.array(reviewSchema),
});

export const getStorefrontProgramsPageResponseSchema = z.object({
  hero: storefrontProgramsPageHeroSchema.deepPartial().nullable(),
  grid: storefrontGridSchema.deepPartial().nullable(),
  cta: storefrontPageCtaSchema.deepPartial().nullable(),
  seo: seoResponseSchema,
  productsList: z.array(productSchema),
});

export const getAboutPageResponseSchema = z.object({
  hero: aboutPageHeroSchema.deepPartial().nullable(),
  journey: aboutPageJourneySchema.deepPartial().nullable(),
  credentials: aboutPageCredentialsSchema.deepPartial().nullable(),
  personal: aboutPagePersonalSchema.deepPartial().nullable(),
  cta: aboutPageCtaSchema.deepPartial().nullable(),
  seo: seoResponseSchema,
});

export const getBlogPageResponseSchema = z.object({
  hero: blogPageHeroSchema.deepPartial().nullable(),
  grid: blogGridSchema.deepPartial().nullable(),
  seo: seoResponseSchema,
  featuredPost: publicBlogPostSchema.optional(),
  posts: z.array(publicBlogPostSchema),
  categories: z.array(z.string()),
});

export const getContactPageResponseSchema = z.object({
  hero: contactPageHeroSchema.deepPartial().nullable(),
  form: contactPageFormSchema.deepPartial().nullable(),
  seo: seoResponseSchema,
  programOptions: z.array(programOptionSchema),
});

export const getFaqPageResponseSchema = z.object({
  hero: faqPageHeroSchema.deepPartial().nullable(),
  content: faqContentSchema.deepPartial().nullable(),
  cta: faqPageCtaSchema.deepPartial().nullable(),
  seo: seoResponseSchema,
});

export const getOfferPageResponseSchema = z.object({
  hero: offerPageHeroSchema.deepPartial().nullable(),
  requisites: offerRequisitesSchema.deepPartial().nullable(),
  terms: offerTermsSchema.deepPartial().nullable(),
  seo: seoResponseSchema,
});

export const getSitePageResponseSchema = z.object({
  navigation: siteNavigationSchema.deepPartial().nullable(),
  footer: siteFooterSchema.deepPartial().nullable(),
  leadForm: siteLeadFormSchema.deepPartial().nullable(),
  errors: siteErrorsSchema.deepPartial().nullable(),
});

export const adminPageListItemSchema = z.object({
  id: z.string().cuid(),
  slug: z.nativeEnum(PageSlug),
  title: z.string(),
  updatedAt: z.date(),
});

type PageSectionsMap = typeof PAGE_SECTIONS_MAP;

type PageSectionKey = {
  [TPage in keyof PageSectionsMap]: PageSectionsMap[TPage][keyof PageSectionsMap[TPage]];
}[keyof PageSectionsMap];

export const SECTION_SCHEMAS = {
  [PAGE_SECTIONS_MAP.home.hero]: homePageHeroSchema,
  [PAGE_SECTIONS_MAP.home.whyChoose]: homePageWhyChooseSchema,
  [PAGE_SECTIONS_MAP.home.storefront]: homePageStorefrontProgramsSchema,
  [PAGE_SECTIONS_MAP.home.reviews]: homePageReviewsSchema,
  [PAGE_SECTIONS_MAP.home.contact]: homePageContactSchema,
  [PAGE_SECTIONS_MAP.home.seo]: seoSectionSchema,
  [PAGE_SECTIONS_MAP.storefront.hero]: storefrontProgramsPageHeroSchema,
  [PAGE_SECTIONS_MAP.storefront.grid]: storefrontGridSchema,
  [PAGE_SECTIONS_MAP.storefront.cta]: storefrontPageCtaSchema,
  [PAGE_SECTIONS_MAP.storefront.seo]: seoSectionSchema,
  [PAGE_SECTIONS_MAP.about.hero]: aboutPageHeroSchema,
  [PAGE_SECTIONS_MAP.about.journey]: aboutPageJourneySchema,
  [PAGE_SECTIONS_MAP.about.credentials]: aboutPageCredentialsSchema,
  [PAGE_SECTIONS_MAP.about.personal]: aboutPagePersonalSchema,
  [PAGE_SECTIONS_MAP.about.cta]: aboutPageCtaSchema,
  [PAGE_SECTIONS_MAP.about.seo]: seoSectionSchema,
  [PAGE_SECTIONS_MAP.blog.hero]: blogPageHeroSchema,
  [PAGE_SECTIONS_MAP.blog.grid]: blogGridSchema,
  [PAGE_SECTIONS_MAP.blog.related]: blogRelatedSectionSchema,
  [PAGE_SECTIONS_MAP.blog.seo]: seoSectionSchema,
  [PAGE_SECTIONS_MAP.contact.hero]: contactPageHeroSchema,
  [PAGE_SECTIONS_MAP.contact.form]: contactPageFormSchema,
  [PAGE_SECTIONS_MAP.contact.seo]: seoSectionSchema,
  [PAGE_SECTIONS_MAP.faq.hero]: faqPageHeroSchema,
  [PAGE_SECTIONS_MAP.faq.content]: faqContentSchema,
  [PAGE_SECTIONS_MAP.faq.cta]: faqPageCtaSchema,
  [PAGE_SECTIONS_MAP.faq.seo]: seoSectionSchema,
  [PAGE_SECTIONS_MAP.offer.hero]: offerPageHeroSchema,
  [PAGE_SECTIONS_MAP.offer.requisites]: offerRequisitesSchema,
  [PAGE_SECTIONS_MAP.offer.terms]: offerTermsSchema,
  [PAGE_SECTIONS_MAP.offer.seo]: seoSectionSchema,
  [PAGE_SECTIONS_MAP.site.navigation]: siteNavigationSchema,
  [PAGE_SECTIONS_MAP.site.footer]: siteFooterSchema,
  [PAGE_SECTIONS_MAP.site.leadForm]: siteLeadFormSchema,
  [PAGE_SECTIONS_MAP.site.errors]: siteErrorsSchema,
} satisfies Record<PageSectionKey, z.AnyZodObject>;

type SectionKey = keyof typeof SECTION_SCHEMAS;

const sectionVariant = <TKey extends SectionKey, TSchema extends z.AnyZodObject>(
  key: TKey,
  schema: TSchema,
) =>
  z.object({
    section: z.literal(key),
    data: schema.deepPartial(),
    locale: localeCodeSchema.default(DEFAULT_LOCALE_CODE),
  });

const SECTION_VARIANTS = [
  sectionVariant(PAGE_SECTIONS_MAP.home.hero, homePageHeroSchema),
  sectionVariant(PAGE_SECTIONS_MAP.home.whyChoose, homePageWhyChooseSchema),
  sectionVariant(PAGE_SECTIONS_MAP.home.storefront, homePageStorefrontProgramsSchema),
  sectionVariant(PAGE_SECTIONS_MAP.home.reviews, homePageReviewsSchema),
  sectionVariant(PAGE_SECTIONS_MAP.home.contact, homePageContactSchema),
  sectionVariant(PAGE_SECTIONS_MAP.home.seo, seoSectionSchema),
  sectionVariant(PAGE_SECTIONS_MAP.storefront.hero, storefrontProgramsPageHeroSchema),
  sectionVariant(PAGE_SECTIONS_MAP.storefront.grid, storefrontGridSchema),
  sectionVariant(PAGE_SECTIONS_MAP.storefront.cta, storefrontPageCtaSchema),
  sectionVariant(PAGE_SECTIONS_MAP.storefront.seo, seoSectionSchema),
  sectionVariant(PAGE_SECTIONS_MAP.about.hero, aboutPageHeroSchema),
  sectionVariant(PAGE_SECTIONS_MAP.about.journey, aboutPageJourneySchema),
  sectionVariant(PAGE_SECTIONS_MAP.about.credentials, aboutPageCredentialsSchema),
  sectionVariant(PAGE_SECTIONS_MAP.about.personal, aboutPagePersonalSchema),
  sectionVariant(PAGE_SECTIONS_MAP.about.cta, aboutPageCtaSchema),
  sectionVariant(PAGE_SECTIONS_MAP.about.seo, seoSectionSchema),
  sectionVariant(PAGE_SECTIONS_MAP.blog.hero, blogPageHeroSchema),
  sectionVariant(PAGE_SECTIONS_MAP.blog.grid, blogGridSchema),
  sectionVariant(PAGE_SECTIONS_MAP.blog.related, blogRelatedSectionSchema),
  sectionVariant(PAGE_SECTIONS_MAP.blog.seo, seoSectionSchema),
  sectionVariant(PAGE_SECTIONS_MAP.contact.hero, contactPageHeroSchema),
  sectionVariant(PAGE_SECTIONS_MAP.contact.form, contactPageFormSchema),
  sectionVariant(PAGE_SECTIONS_MAP.contact.seo, seoSectionSchema),
  sectionVariant(PAGE_SECTIONS_MAP.faq.hero, faqPageHeroSchema),
  sectionVariant(PAGE_SECTIONS_MAP.faq.content, faqContentSchema),
  sectionVariant(PAGE_SECTIONS_MAP.faq.cta, faqPageCtaSchema),
  sectionVariant(PAGE_SECTIONS_MAP.faq.seo, seoSectionSchema),
  sectionVariant(PAGE_SECTIONS_MAP.offer.hero, offerPageHeroSchema),
  sectionVariant(PAGE_SECTIONS_MAP.offer.requisites, offerRequisitesSchema),
  sectionVariant(PAGE_SECTIONS_MAP.offer.terms, offerTermsSchema),
  sectionVariant(PAGE_SECTIONS_MAP.offer.seo, seoSectionSchema),
  sectionVariant(PAGE_SECTIONS_MAP.site.navigation, siteNavigationSchema),
  sectionVariant(PAGE_SECTIONS_MAP.site.footer, siteFooterSchema),
  sectionVariant(PAGE_SECTIONS_MAP.site.leadForm, siteLeadFormSchema),
  sectionVariant(PAGE_SECTIONS_MAP.site.errors, siteErrorsSchema),
] as const;

export const updatePageSectionBodySchema = z.discriminatedUnion("section", SECTION_VARIANTS);

export const updatePageSectionSchema = updatePageSectionBodySchema.and(
  z.object({ pageSlug: z.nativeEnum(PageSlug) }),
);

const toNonEmptyArray = <T>(arr: T[]): [T, ...T[]] => {
  const [first, ...rest] = arr;

  if (first === undefined) {
    throw new Error("Expected non-empty array");
  }

  return [first, ...rest];
};

const adminSectionVariants = SECTION_VARIANTS.map((variant) =>
  z.object({
    id: z.string().cuid(),
    section: variant.shape.section,
    data: variant.shape.data,
    updatedAt: z.date(),
  }),
);

export const adminPageDetailsSchema = z.object({
  slug: z.nativeEnum(PageSlug),
  locale: localeCodeSchema,
  sections: z.array(z.discriminatedUnion("section", toNonEmptyArray(adminSectionVariants))),
});

export const getPageBySlugParamsSchema = z.object({
  pageSlug: z.nativeEnum(PageSlug),
});

export const pageSlugRouteParamsSchema = z.object({
  slug: z.nativeEnum(PageSlug),
});

export const revalidateQuerySchema = z.object({
  path: z.string().startsWith("/"),
  type: z.literal("layout").optional(),
});
