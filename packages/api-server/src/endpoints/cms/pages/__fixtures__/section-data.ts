import { type z } from "zod";

import {
  type PAGE_SECTIONS_MAP,
  type PageSlug,
  type SECTION_SCHEMAS,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";

type FullSectionData = { [K in SectionSchemaKey]: z.infer<(typeof SECTION_SCHEMAS)[K]> };

type HeroSectionKey = (typeof PAGE_SECTIONS_MAP)[PageSlug]["hero"];

type PartialHeroSectionData = {
  [K in HeroSectionKey]: Partial<z.infer<(typeof SECTION_SCHEMAS)[K]>>;
};

const heroSection = (title: string) => ({
  title,
  subtitle: "Subtitle",
  buttonText: "Start",
  buttonHref: "/start",
  backgroundImage: "/bg.jpg",
});

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

export const PARTIAL_SECTION_DATA: PartialHeroSectionData = {
  "home:hero": { title: "Partial Home Hero" },
  "storefront:hero": { title: "Partial Storefront Hero" },
  "about:hero": { title: "Partial About Hero" },
  "blog:hero": { title: "Partial Blog Hero" },
  "contact:hero": { title: "Partial Contact Hero" },
  "faq:hero": { title: "Partial FAQ Hero" },
};
