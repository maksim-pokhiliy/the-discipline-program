import { type z } from "zod";

import { type SECTION_SCHEMAS } from "./pages-api.schema";
import { PAGE_SECTIONS_MAP } from "./pages.constants";

type PageSectionsMap = typeof PAGE_SECTIONS_MAP;

type SiteSectionKey = PageSectionsMap["site"][keyof PageSectionsMap["site"]];

type SeoSectionKey = PageSectionsMap[Exclude<keyof PageSectionsMap, "site">]["seo"];

export type DefaultedSectionKey = SeoSectionKey | SiteSectionKey;

export type SectionDefaults = {
  [TKey in DefaultedSectionKey]: z.infer<(typeof SECTION_SCHEMAS)[TKey]>;
};

export const SECTION_DEFAULTS: SectionDefaults = {
  [PAGE_SECTIONS_MAP.home.seo]: {
    title: "The Discipline Program — Home",
    description:
      "Structured training and coaching program that helps you build consistency, strength, and endurance through discipline.",
  },
  [PAGE_SECTIONS_MAP.storefront.seo]: {
    title: "Storefront — The Discipline Program",
    description:
      "Explore training programs tailored to your goals: strength, conditioning, fat loss, and performance.",
  },
  [PAGE_SECTIONS_MAP.about.seo]: {
    title: "About — The Discipline Program",
    description:
      "Learn the story, principles, and coaching philosophy behind The Discipline Program.",
  },
  [PAGE_SECTIONS_MAP.blog.seo]: {
    title: "Blog — The Discipline Program",
    description:
      "Articles on training, recovery, mindset, and discipline to improve your performance.",
  },
  [PAGE_SECTIONS_MAP.contact.seo]: {
    title: "Contact — The Discipline Program",
    description:
      "Have questions about programs or coaching? Reach out and get a personalized answer.",
  },
  [PAGE_SECTIONS_MAP.faq.seo]: {
    title: "FAQ — The Discipline Program",
    description:
      "Frequently asked questions about training programs, trials, equipment, and coaching.",
  },
  [PAGE_SECTIONS_MAP.offer.seo]: {
    title: "Public Offer — The Discipline Program",
    description:
      "Seller details and the terms of buying a training program from The Discipline Program.",
  },
  [PAGE_SECTIONS_MAP.site.navigation]: {
    home: "Home",
    storefront: "Programs",
    about: "About",
    blog: "Blog",
    faq: "FAQ",
    contact: "Contact",
    offer: "Public Offer",
    navigationLabel: "Main",
    openMenuLabel: "Open menu",
    closeMenuLabel: "Close menu",
    languageSwitchLabel: "Change language",
  },
  [PAGE_SECTIONS_MAP.site.footer]: {
    tagline: "Your Discipline Dictates Your Success",
    subcopy: "Transform your fitness through discipline",
    rightsLabel: "All rights reserved.",
  },
  [PAGE_SECTIONS_MAP.site.leadForm]: {
    title: "Get started",
    productPrefix: "You're getting:",
    nameLabel: "Name",
    contactLabel: "Contact (phone, Telegram, email)",
    messageLabel: "Message (optional)",
    submitLabel: "Send",
    sendingLabel: "Sending…",
    successTitle: "You're all set",
    successMessage: "Thanks for your interest. We'll reach out to you shortly.",
    sendAnotherLabel: "Send another",
    errorMessage: "Something went wrong. Please try again.",
    contactRequiredMessage: "Phone, Telegram, or other contact is required",
  },
  [PAGE_SECTIONS_MAP.site.errors]: {
    notFoundTitle: "Page not found",
    errorGlyph: "Error",
    errorTitle: "Something went wrong",
    errorIdLabel: "Error ID:",
    retryLabel: "Try again",
    homeLabel: "Go home",
  },
};
