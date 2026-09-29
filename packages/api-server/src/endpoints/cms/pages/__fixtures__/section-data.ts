import { type Prisma } from "@prisma/client";
import { type z } from "zod";

import { type SECTION_SCHEMAS, type SectionSchemaKey } from "@repo/contracts/cms/pages";

type FullSectionData = { [K in SectionSchemaKey]: z.infer<(typeof SECTION_SCHEMAS)[K]> };

function heroSection(title: string) {
  return {
    title,
    subtitle: "Subtitle",
    buttonText: "Start",
    buttonHref: "/start",
    backgroundImage: "/bg.jpg",
  };
}

const CTA_SECTION = {
  title: "CTA",
  subtitle: "Subtitle",
  buttonText: "Start",
  buttonHref: "/start",
};

export const FULL_SECTION_DATA: FullSectionData = {
  "home:hero": heroSection("Home"),
  "home:whyChoose": { title: "Why choose", subtitle: "Subtitle", features: [] },
  "home:storefront": {
    title: "Programs",
    subtitle: "Subtitle",
    buttonText: "View",
    buttonHref: "/programs",
    freeLabel: "Free",
    cardActionLabel: "Details",
    modalDismissLabel: "Cancel",
    modalActionLabel: "Sign up",
  },
  "home:reviews": { title: "Reviews", subtitle: "Subtitle" },
  "home:contact": {
    title: "Contact",
    subtitle: "Subtitle",
    buttonText: "Reach out",
    buttonHref: "/contact",
  },
  "storefront:hero": heroSection("Storefront"),
  "storefront:grid": {
    title: "Programs",
    subtitle: "Subtitle",
    freeLabel: "Free",
    modalDismissLabel: "Cancel",
    modalActionLabel: "Sign up",
  },
  "storefront:cta": CTA_SECTION,
  "about:hero": heroSection("About"),
  "about:journey": { title: "Journey", subtitle: "Subtitle", timeline: [] },
  "about:credentials": { title: "Credentials", subtitle: "Subtitle", items: [] },
  "about:personal": {
    title: "Personal",
    subtitle: "Subtitle",
    description: "Bio text",
    image: "https://example.com/photo.jpg",
    name: "Coach",
    role: "Head Coach",
  },
  "about:cta": CTA_SECTION,
  "blog:hero": { title: "Blog", subtitle: "Subtitle" },
  "blog:grid": {
    title: "Grid",
    subtitle: "Subtitle",
    readMoreLabel: "Read more",
    minReadSuffix: "min read",
    readArticleLabel: "Read article",
    notPublishedLabel: "Not published",
  },
  "blog:related": { title: "Related articles" },
  "contact:hero": heroSection("Contact"),
  "contact:form": {
    title: "Form",
    subtitle: "Subtitle",
    successTitle: "Sent",
    successMessage: "We will get back to you",
    submitLabel: "Send",
    sendAnotherLabel: "Send another",
    sendingLabel: "Sending...",
    errorMessage: "Something went wrong",
    fieldLabels: { name: "Name", contact: "Contact", program: "Program", message: "Message" },
    fieldPlaceholders: { contact: "Email or phone", message: "Your message" },
  },
  "faq:hero": heroSection("FAQ"),
  "faq:content": { title: "Content", subtitle: "Subtitle", items: [] },
  "faq:cta": CTA_SECTION,
};

export const PARTIAL_SECTION_DATA: Record<SectionSchemaKey, Prisma.InputJsonValue> = {
  "home:hero": { title: "Partial Home Hero" },
  "home:whyChoose": { title: "Partial Why Choose" },
  "home:storefront": { title: "Partial Home Storefront" },
  "home:reviews": { title: "Partial Home Reviews" },
  "home:contact": { title: "Partial Home Contact" },
  "storefront:hero": { title: "Partial Storefront Hero" },
  "storefront:grid": { title: "Partial Storefront Grid" },
  "storefront:cta": { title: "Partial Storefront CTA" },
  "about:hero": { title: "Partial About Hero" },
  "about:journey": { title: "Partial About Journey" },
  "about:credentials": { title: "Partial About Credentials" },
  "about:personal": { title: "Partial About Personal" },
  "about:cta": { title: "Partial About CTA" },
  "blog:hero": { title: "Partial Blog Hero" },
  "blog:grid": { readMoreLabel: "Read more" },
  "blog:related": { title: "Partial Related Articles" },
  "contact:hero": { title: "Partial Contact Hero" },
  "contact:form": { title: "Partial Contact Form" },
  "faq:hero": { title: "Partial FAQ Hero" },
  "faq:content": { title: "Partial FAQ Content" },
  "faq:cta": { title: "Partial FAQ CTA" },
};
