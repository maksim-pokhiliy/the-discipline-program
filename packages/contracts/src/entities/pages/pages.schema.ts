import { z } from "zod";

import { CONTACT_METHOD_TYPES } from "./pages.constants";

export const homePageHeroSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  buttonText: z.string(),
  buttonHref: z.string(),
  backgroundImage: z.string(),
});

export const homePageWhyChooseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
});

export const homePageProgramsSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundImage: z.string(),
});

export const homePageReviewsSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
});

export const homePageContactSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
});

export const programsPageHeroSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundImage: z.string().optional(),
});

export const aboutPageHeroSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundImage: z.string(),
});

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
  items: z.array(credentialItemSchema),
});

export const aboutPagePersonalSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string(),
  name: z.string(),
  role: z.string(),
});

export const aboutPageCtaSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  buttonText: z.string(),
  buttonHref: z.string(),
});

export const contactPageHeroSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundImage: z.string().optional(),
});

export const contactFormSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  programs: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
  ),
});

export const contactMethodSchema = z.object({
  type: z.enum(CONTACT_METHOD_TYPES),
  label: z.string(),
  value: z.string(),
  href: z.string(),
});

export const contactDirectContactSchema = z.object({
  title: z.string(),
  contacts: z.array(contactMethodSchema),
  workingHours: z.string(),
});

export const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const contactPageFaqSchema = z.object({
  title: z.string(),
  items: z.array(faqItemSchema),
});

export const blogPageHeroSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundImage: z.string().optional(),
});
