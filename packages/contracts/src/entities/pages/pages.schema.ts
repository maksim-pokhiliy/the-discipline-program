import { z } from "zod";

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
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  iconName: z.string().min(1, "Icon name is required"),
});

export const homePageWhyChooseSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  subtitle: z.string().min(1, "Section subtitle is required"),
  features: z.array(whyChooseFeatureItemSchema),
});

export const homePageStorefrontProgramsSchema = titleSubtitleSchema.extend({
  buttonText: z.string(),
  buttonHref: z.string(),
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
  value: z.string(),
  label: z.string(),
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

export const storefrontGridSchema = titleSubtitleSchema;

export const faqPageHeroSchema = heroSectionSchema;

export const faqPageCtaSchema = ctaSectionSchema;

export const blogPageHeroSchema = titleSubtitleSchema.extend({
  backgroundImage: z.string().optional(),
});

export const blogGridSchema = titleSubtitleSchema;
