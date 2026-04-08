import { baseEnv } from "@repo/env/base";

type OrganizationConfig = {
  name: string;
  url: string;
  logo: string;
  founder: {
    name: string;
  };
};

type SeoConfig = {
  siteName: string;
  siteUrl: string;
  tagline: string;
  subcopy: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  defaultOgImage: string;
  twitterHandle?: string;
  organization: OrganizationConfig;
};

export const SEO_CONFIG: SeoConfig = {
  siteName: "The Discipline Program",
  siteUrl: baseEnv.NEXT_PUBLIC_MARKETING_URL,
  tagline: "Your Discipline Dictates Your Success",
  subcopy: "Transform your fitness through discipline",
  defaultTitle: "The Discipline Program",
  defaultDescription: "Structured training and coaching program for disciplined athletes.",
  defaultKeywords: ["fitness", "discipline", "training program", "coaching", "workout"],
  defaultOgImage: "/images/pages/home-hero.png",
  twitterHandle: "@discipline_program",
  organization: {
    name: "The Discipline Program",
    url: baseEnv.NEXT_PUBLIC_MARKETING_URL,
    logo: "/icons/logo.svg",
    founder: {
      name: "Denis Sergeev",
    },
  },
};
