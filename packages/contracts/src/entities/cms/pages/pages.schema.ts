import { z } from "zod";

import { PageSlug, type PublicPageSlug } from "./pages.constants";

const titleSubtitleSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
});

const heroSectionSchema = titleSubtitleSchema.extend({
  buttonText: z.string(),
  buttonHref: z.string(),
  backgroundImage: z.string(),
});

const ctaSectionSchema = titleSubtitleSchema.extend({
  buttonText: z.string(),
  buttonHref: z.string(),
});

export const homePageHeroSchema = heroSectionSchema;

export const whyChooseFeatureItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  iconName: z.string(),
});

export const homePageWhyChooseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  features: z.array(whyChooseFeatureItemSchema),
});

export const homePageStorefrontProgramsSchema = titleSubtitleSchema.extend({
  buttonText: z.string(),
  buttonHref: z.string(),
  freeLabel: z.string(),
  cardActionLabel: z.string(),
  modalDismissLabel: z.string(),
  modalActionLabel: z.string(),
});

export const homePageReviewsSchema = titleSubtitleSchema;

export const homePageContactSchema = ctaSectionSchema;

export const storefrontProgramsPageHeroSchema = heroSectionSchema;

export const storefrontPageCtaSchema = ctaSectionSchema;

export const aboutPageHeroSchema = heroSectionSchema;

export const timelineItemSchema = z.object({
  year: z.string(),
  title: z.string(),
  description: z.string(),
});

export const aboutPageJourneySchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  timeline: z.array(timelineItemSchema),
});

export const credentialItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const aboutPageCredentialsSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  items: z.array(credentialItemSchema),
});

export const aboutPagePersonalSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  image: z.string(),
  name: z.string(),
  role: z.string(),
});

export const aboutPageCtaSchema = ctaSectionSchema;

export const contactPageHeroSchema = heroSectionSchema;

export const contactPageFormSchema = titleSubtitleSchema.extend({
  successTitle: z.string(),
  successMessage: z.string(),
  submitLabel: z.string(),
  sendAnotherLabel: z.string(),
  sendingLabel: z.string(),
  errorMessage: z.string(),
  fieldLabels: z.object({
    name: z.string(),
    contact: z.string(),
    program: z.string(),
    message: z.string(),
  }),
  fieldPlaceholders: z.object({
    contact: z.string(),
    message: z.string(),
  }),
});

export const programOptionSchema = z.object({
  slug: z.string(),
  title: z.string(),
});

export const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const faqContentSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  items: z.array(faqItemSchema),
});

export const storefrontGridSchema = titleSubtitleSchema.extend({
  freeLabel: z.string(),
  cardActionLabel: z.string(),
  modalDismissLabel: z.string(),
  modalActionLabel: z.string(),
});

export const faqPageHeroSchema = heroSectionSchema;

export const faqPageCtaSchema = ctaSectionSchema;

export const blogPageHeroSchema = titleSubtitleSchema.extend({
  backgroundImage: z.string().optional(),
});

export const blogGridSchema = titleSubtitleSchema.extend({
  readMoreLabel: z.string(),
  minReadSuffix: z.string(),
  readArticleLabel: z.string(),
  notPublishedLabel: z.string(),
});

export const blogRelatedSectionSchema = z.object({
  title: z.string(),
});

export const seoSectionSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const offerPageHeroSchema = titleSubtitleSchema;

export const requisiteItemSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const offerRequisitesSchema = z.object({
  title: z.string(),
  items: z.array(requisiteItemSchema),
});

export const termsBlockSchema = z.object({
  heading: z.string(),
  body: z.string(),
});

export const offerTermsSchema = z.object({
  title: z.string(),
  blocks: z.array(termsBlockSchema),
});

const navigationLinkLabelsShape = {
  [PageSlug.HOME]: z.string(),
  [PageSlug.STOREFRONT]: z.string(),
  [PageSlug.ABOUT]: z.string(),
  [PageSlug.BLOG]: z.string(),
  [PageSlug.FAQ]: z.string(),
  [PageSlug.CONTACT]: z.string(),
  [PageSlug.OFFER]: z.string(),
} satisfies Record<PublicPageSlug, z.ZodString>;

export const siteNavigationSchema = z.object({
  ...navigationLinkLabelsShape,
  navigationLabel: z.string(),
  openMenuLabel: z.string(),
  closeMenuLabel: z.string(),
  languageSwitchLabel: z.string(),
});

export const siteFooterSchema = z.object({
  tagline: z.string(),
  subcopy: z.string(),
  rightsLabel: z.string(),
});

export const siteLeadFormSchema = z.object({
  title: z.string(),
  productPrefix: z.string(),
  nameLabel: z.string(),
  contactLabel: z.string(),
  messageLabel: z.string(),
  submitLabel: z.string(),
  sendingLabel: z.string(),
  successTitle: z.string(),
  successMessage: z.string(),
  sendAnotherLabel: z.string(),
  errorMessage: z.string(),
  contactRequiredMessage: z.string(),
});

export const siteErrorsSchema = z.object({
  notFoundTitle: z.string(),
  errorGlyph: z.string(),
  errorTitle: z.string(),
  errorIdLabel: z.string(),
  retryLabel: z.string(),
  homeLabel: z.string(),
});
