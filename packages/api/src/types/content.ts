import { Feature } from "./feature";
import { Program } from "./program";
import { Review } from "./review";

export interface PageContent {
  id: string;
  pageSlug: string;
  section: string;
  key: string;
  value: string;
  type: "text" | "image" | "url";
}

export interface HomePageData {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
    backgroundImage: string;
  };
  whyChoose: { title: string; subtitle: string };
  programs: { title: string; subtitle: string; backgroundImage: string };
  reviews: { title: string; subtitle: string };
  contact: { title: string; subtitle: string };
  features: Feature[];
  programsList: Program[];
  reviewsList: Review[];
}

export interface ProgramsPageData {
  hero: {
    title: string;
    subtitle: string;
  };
  programsList: Program[];
}

export interface AboutPageData {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage: string;
  };
  journey: {
    title: string;
    subtitle: string;
    timeline: TimelineItem[];
  };
  credentials: {
    title: string;
    items: string[];
  };
  personal: {
    title: string;
    description: string;
    image: string;
  };
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonHref: string;
  };
}

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

export interface ContactPageData {
  hero: {
    title: string;
    subtitle: string;
  };
  form: {
    title: string;
    subtitle: string;
    programs: { value: string; label: string }[];
  };
  directContact: {
    title: string;
    contacts: ContactMethod[];
    workingHours: string;
  };
  faq: {
    title: string;
    items: FAQItem[];
  };
}

interface ContactMethod {
  type: "telegram" | "email" | "phone";
  label: string;
  value: string;
  href: string;
}

interface FAQItem {
  question: string;
  answer: string;
}
