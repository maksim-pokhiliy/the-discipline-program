// packages/shared/src/seo.ts

export interface OrganizationConfig {
  name: string;
  url: string;
  logo: string;
  founder: {
    name: string;
  };
}

export interface SeoConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  defaultOgImage: string;
  twitterHandle?: string;
  organization: OrganizationConfig;
}

export const SEO_CONFIG: SeoConfig = {
  siteName: "The Discipline Program",
  siteUrl: "https://the-discipline-program.vercel.app",
  defaultTitle: "The Discipline Program",
  defaultDescription: "Structured training and coaching program for disciplined athletes.",
  defaultKeywords: ["fitness", "discipline", "training program", "coaching", "workout"],
  defaultOgImage: "/images/pages/home-hero.png",
  twitterHandle: "@discipline_program",
  organization: {
    name: "The Discipline Program",
    url: "https://the-discipline-program.vercel.app",
    logo: "/icons/logo.svg",
    founder: {
      name: "Coach",
    },
  },
};
