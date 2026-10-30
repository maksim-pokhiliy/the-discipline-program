import { type z } from "zod";

import {
  type PAGE_SECTIONS_MAP,
  type PublicPageSlug,
  type SECTION_SCHEMAS,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";

type FullSectionData = { [K in SectionSchemaKey]: z.infer<(typeof SECTION_SCHEMAS)[K]> };

type HeroSectionKey = (typeof PAGE_SECTIONS_MAP)[PublicPageSlug]["hero"];

type PartialSectionData<TKey extends SectionSchemaKey> = {
  [K in TKey]: Partial<z.infer<(typeof SECTION_SCHEMAS)[K]>>;
};

const heroSection = (title: string) => ({
  title,
  subtitle: "Subtitle",
  buttonText: "Start",
  buttonHref: "/start",
  backgroundImage: "/bg.jpg",
});

const seoSection = (page: string) => ({
  title: `${page} search title`,
  description: `${page} search description`,
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
  "home:seo": seoSection("Home"),
  "storefront:hero": heroSection("Storefront"),
  "storefront:grid": {
    title: "Programs",
    subtitle: "Subtitle",
    freeLabel: "Free",
    cardActionLabel: "Open program",
    modalDismissLabel: "Cancel",
    modalActionLabel: "Sign up",
  },
  "storefront:cta": CTA_SECTION,
  "storefront:seo": seoSection("Storefront"),
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
  "about:seo": seoSection("About"),
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
  "blog:seo": seoSection("Blog"),
  "contact:hero": heroSection("Contact"),
  "contact:form": {
    title: "Form",
    subtitle: "Subtitle",
    successTitle: "Sent",
    successMessage: "We will get back to you",
    submitLabel: "Send",
    sendAnotherLabel: "Send one more",
    sendingLabel: "Sending...",
    errorMessage: "Could not send",
    fieldLabels: { name: "Name", contact: "Contact", program: "Program", message: "Message" },
    fieldPlaceholders: { contact: "Email or phone", message: "Your message" },
  },
  "contact:seo": seoSection("Contact"),
  "faq:hero": heroSection("FAQ"),
  "faq:content": { title: "Content", subtitle: "Subtitle", items: [] },
  "faq:cta": CTA_SECTION,
  "faq:seo": seoSection("FAQ"),
  "offer:hero": { title: "Offer", subtitle: "Subtitle" },
  "offer:requisites": {
    title: "Requisites",
    items: [
      { label: "Seller", value: "Sample seller" },
      { label: "Tax number", value: "0000000000" },
    ],
  },
  "offer:terms": {
    title: "Terms",
    blocks: [{ heading: "Payment", body: "Sample payment terms" }],
  },
  "offer:seo": seoSection("Offer"),
  "site:navigation": {
    home: "Nav home",
    storefront: "Nav programs",
    about: "Nav about",
    blog: "Nav blog",
    faq: "Nav faq",
    contact: "Nav contact",
    offer: "Nav offer",
    navigationLabel: "Nav landmark",
    openMenuLabel: "Nav open",
    closeMenuLabel: "Nav close",
    languageSwitchLabel: "Nav language",
  },
  "site:footer": {
    tagline: "Footer tagline",
    subcopy: "Footer subcopy",
    rightsLabel: "Footer rights",
  },
  "site:leadForm": {
    title: "Lead title",
    productPrefix: "Lead product prefix",
    nameLabel: "Lead name",
    contactLabel: "Lead contact",
    messageLabel: "Lead message",
    submitLabel: "Lead submit",
    sendingLabel: "Lead sending",
    successTitle: "Lead success title",
    successMessage: "Lead success message",
    sendAnotherLabel: "Lead send another",
    errorMessage: "Lead error",
    contactRequiredMessage: "Lead contact required",
  },
  "site:errors": {
    notFoundTitle: "Errors not found",
    errorGlyph: "Errors glyph",
    errorTitle: "Errors title",
    errorIdLabel: "Errors id label",
    retryLabel: "Errors retry",
    homeLabel: "Errors home",
  },
};

export const PARTIAL_SECTION_DATA: PartialSectionData<HeroSectionKey> = {
  "home:hero": { title: "Partial Home Hero" },
  "storefront:hero": { title: "Partial Storefront Hero" },
  "about:hero": { title: "Partial About Hero" },
  "blog:hero": { title: "Partial Blog Hero" },
  "contact:hero": { title: "Partial Contact Hero" },
  "faq:hero": { title: "Partial FAQ Hero" },
  "offer:hero": { title: "Partial Offer Hero" },
};

export const UNPARSABLE_SECTION_DATA = { title: 42 };

export const UK_ABOUT_HERO = heroSection("Про мене");

export const GERMAN_ABOUT_HERO = { title: "Über mich" };

export const UK_BLOG_SECTIONS: PartialSectionData<"blog:grid" | "blog:related"> = {
  "blog:grid": {
    readMoreLabel: "Читати далі",
    minReadSuffix: "хв читання",
    readArticleLabel: "Читати статтю",
    notPublishedLabel: "Не опубліковано",
  },
  "blog:related": { title: "Схожі статті" },
};
