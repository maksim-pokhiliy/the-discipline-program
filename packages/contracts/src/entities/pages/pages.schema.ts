import { z } from "zod";

import { CONTACT_METHOD_TYPES } from "./pages.constants";

export const homePageHeroSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    buttonText: z.string(),
    buttonHref: z.string(),
    backgroundImage: z.string(),
  })
  .strict();

export const homePageWhyChooseSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
  })
  .strict();

export const homePageProgramsSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    backgroundImage: z.string(),
  })
  .strict();

export const homePageReviewsSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
  })
  .strict();

export const homePageContactSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
  })
  .strict();

export const programsPageHeroSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    backgroundImage: z.string().optional(),
  })
  .strict();

export const aboutPageHeroSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    backgroundImage: z.string(),
  })
  .strict();

export const timelineItemSchema = z
  .object({
    year: z.string(),
    title: z.string(),
    description: z.string(),
  })
  .strict();

export const aboutPageJourneySchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    timeline: z.array(timelineItemSchema),
  })
  .strict();

export const credentialItemSchema = z
  .object({
    title: z.string(),
    description: z.string(),
  })
  .strict();

export const aboutPageCredentialsSchema = z
  .object({
    title: z.string(),
    items: z.array(credentialItemSchema),
  })
  .strict();

export const aboutPagePersonalSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    image: z.string(),
    name: z.string(),
    role: z.string(),
  })
  .strict();

export const aboutPageCtaSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    buttonText: z.string(),
    buttonHref: z.string(),
  })
  .strict();

export const contactPageHeroSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    backgroundImage: z.string().optional(),
  })
  .strict();

export const contactFormSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    programs: z.array(
      z
        .object({
          value: z.string(),
          label: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export const contactMethodSchema = z
  .object({
    type: z.enum(CONTACT_METHOD_TYPES),
    label: z.string(),
    value: z.string(),
    href: z.string(),
  })
  .strict();

export const contactDirectContactSchema = z
  .object({
    title: z.string(),
    contacts: z.array(contactMethodSchema),
    workingHours: z.string(),
  })
  .strict();

export const faqItemSchema = z
  .object({
    question: z.string(),
    answer: z.string(),
  })
  .strict();

export const contactPageFaqSchema = z
  .object({
    title: z.string(),
    items: z.array(faqItemSchema),
  })
  .strict();

export const blogPageHeroSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    backgroundImage: z.string().optional(),
  })
  .strict();
